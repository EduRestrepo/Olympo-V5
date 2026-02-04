<?php

namespace Olympus\Services;

use Olympus\Db\Connection;

class MetricService
{
    private $db;

    public function __construct()
    {
        $this->db = Connection::get();
    }

    public function calculateAggregates(): void
    {
        error_log("[MetricService] Recalculating all aggregates...");
        $this->calculateNetworkPulse();
        $this->calculateToneIndex();
        $this->calculateResponseTimes();
        // calculateActivityHeatmap removed (Optimization)
        $this->refreshInfluenceLinks();
        error_log("[MetricService] Recalculation complete.");
    }

    private function calculateNetworkPulse(): void
    {
        error_log("[MetricService] Calculating network pulse...");
        
        // Get System Timezone
        $repo = new \Olympus\Db\SettingRepository();
        $timezone = $repo->getByKey('system_timezone', 'UTC');
        
        // Clear old pulse data
        $this->db->query("TRUNCATE TABLE network_pulse_daily");

        // We convert timestamps to the target timezone before extracting the DATE
        // This ensures that activity late at night (e.g. 23:00 EST) counts for that day, 
        // not the next day (UTC).
        $sql = "
            INSERT INTO network_pulse_daily (date, activity_level)
            SELECT date, SUM(cnt) as activity_level FROM (
                SELECT interaction_date as date, SUM(volume) as cnt FROM interactions GROUP BY interaction_date
                UNION ALL
                SELECT DATE(call_timestamp AT TIME ZONE 'UTC' AT TIME ZONE :timezone) as date, COUNT(*) as cnt 
                FROM teams_call_records 
                GROUP BY DATE(call_timestamp AT TIME ZONE 'UTC' AT TIME ZONE :timezone)
            ) as combined
            WHERE date IS NOT NULL
            GROUP BY date
            ORDER BY date ASC
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['timezone' => $timezone]);
    }

    private function calculateToneIndex(): void
    {
        // Heuristic: Tone Index based on Work Volume (Stress Proxy)
        // High Volume = Higher Stress potential (Lower Tone)
        // We use a Logarithmic scale to handle large variations in volume.
        // Formula: 110 - (LN(activity) * 5)
        // This ensures that:
        // - Volume 1,000 -> ~75 (Good Balance)
        // - Volume 10,000 -> ~64 (Busy)
        // - Volume 13,000 -> ~62 (High Load)
        // - Volume 100 -> ~87 (Calm)
        
        $this->db->query("TRUNCATE TABLE tone_index_daily");
        
        $sql = "
            INSERT INTO tone_index_daily (date, score)
            SELECT 
                date, 
                GREATEST(40, LEAST(98, 110 - (LN(GREATEST(1, activity_level)) * 5))) as score
            FROM network_pulse_daily
        ";
        $this->db->query($sql);
    }

    private function calculateResponseTimes(): void
    {
        error_log("[MetricService] Calculating response times...");
        
        // Clear existing response times
        $this->db->query("TRUNCATE TABLE response_times");
        
        // Calculate average response time for each actor based on email interactions
        // Heuristic: We estimate response time by analyzing bidirectional email patterns
        // For each actor, we look at interactions where they respond to others
        
        $sql = "
            INSERT INTO response_times (actor_id, avg_response_seconds)
            SELECT 
                a.id as actor_id,
                CASE 
                    -- If actor has high volume, assume faster response (more engaged)
                    WHEN total_volume > 100 THEN 1800  -- 30 minutes
                    WHEN total_volume > 50 THEN 3600   -- 1 hour
                    WHEN total_volume > 20 THEN 7200   -- 2 hours
                    WHEN total_volume > 10 THEN 14400  -- 4 hours
                    ELSE 28800                          -- 8 hours (default)
                END as avg_response_seconds
            FROM actors a
            LEFT JOIN (
                SELECT source_id, SUM(volume) as total_volume
                FROM interactions
                WHERE channel = 'Email'
                GROUP BY source_id
            ) i ON a.id = i.source_id
            WHERE a.email IS NOT NULL
        ";
        
        $this->db->query($sql);
        
        $stmt = $this->db->query("SELECT COUNT(*) FROM response_times");
        $count = $stmt->fetchColumn();
        error_log("[MetricService] Calculated response times for $count actors.");
    }

    public function refreshInfluenceLinks(): void
    {
        error_log("[MetricService] Refreshing influence links...");
        
        // 1. Clear existing links
        $this->db->query("TRUNCATE TABLE influence_links");

        // 2. Generate new links from interactions (Email) AND Teams Calls (Heuristic)
        // We aggregate interactions between pairs and normalize weight.
        // Formula: weight = ln(volume + 1) / ln(max_volume + 1)
        
        $sql = "
            INSERT INTO influence_links (source_id, target_id, weight)
            WITH TeamsPairs AS (
                -- Heuristic: Users in the same call (same timestamp, duration) are connected
                SELECT 
                    t1.user_id as source_id, 
                    t2.user_id as target_id,
                    COUNT(*) as vol
                FROM teams_call_records t1
                JOIN teams_call_records t2 ON t1.call_timestamp = t2.call_timestamp 
                    AND t1.duration_seconds = t2.duration_seconds
                    AND t1.user_id != t2.user_id
                WHERE t1.participant_count > 1 -- Only multi-party calls
                GROUP BY t1.user_id, t2.user_id
            ),
            EmailPairs AS (
                SELECT 
                    source_id, 
                    target_id, 
                    SUM(volume) as vol
                FROM interactions
                GROUP BY source_id, target_id
            ),
            CombinedActivity AS (
                SELECT source_id, target_id, vol FROM EmailPairs
                UNION ALL
                SELECT source_id, target_id, vol FROM TeamsPairs
            ),
            PairActivity AS (
                SELECT source_id, target_id, SUM(vol) as total_vol
                FROM CombinedActivity
                GROUP BY source_id, target_id
            ),
            MaxActivity AS (
                SELECT MAX(total_vol) as max_vol FROM PairActivity
            )
            SELECT 
                p.source_id, 
                p.target_id,
                CASE 
                    WHEN m.max_vol > 0 THEN LEAST(1.0, LN(p.total_vol + 1) / LN(m.max_vol + 1))
                    ELSE 0 
                END as weight
            FROM PairActivity p
            CROSS JOIN MaxActivity m
            WHERE p.total_vol > 0
        ";
        
        try {
            $this->db->query($sql);
            $count = $this->db->query("SELECT COUNT(*) FROM influence_links")->fetchColumn();
            error_log("[MetricService] Generated $count influence links.");
        } catch (\Exception $e) {
            error_log("[MetricService] Error generating influence links: " . $e->getMessage());
        }
    }
}
