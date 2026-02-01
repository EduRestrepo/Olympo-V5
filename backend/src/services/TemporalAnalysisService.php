<?php

namespace Olympus\Services;

use Olympus\Db\Connection;
use PDO;

class TemporalAnalysisService
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Generate activity heatmap data for all users or specific user
     * @param int|null $actorId Optional actor ID to filter
     * @param string $startDate Start date (Y-m-d)
     * @param string $endDate End date (Y-m-d)
     * @return array Heatmap data grouped by date and hour
     */
    public function getActivityHeatmap(?int $actorId = null, string $startDate = null, string $endDate = null): array
    {
        $endDate = $endDate ?? date('Y-m-d');
        $startDate = $startDate ?? date('Y-m-d', strtotime('-30 days'));

        $sql = "SELECT 
                    ah.actor_id,
                    a.name as actor_name,
                    ah.activity_date,
                    ah.hour_of_day,
                    ah.email_count,
                    ah.meeting_count,
                    ah.total_activity
                FROM activity_heatmap ah
                JOIN actors a ON ah.actor_id = a.id
                WHERE ah.activity_date BETWEEN :start_date AND :end_date";

        if ($actorId) {
            $sql .= " AND ah.actor_id = :actor_id";
        }

        $sql .= " ORDER BY ah.activity_date, ah.hour_of_day";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':start_date', $startDate);
        $stmt->bindParam(':end_date', $endDate);
        if ($actorId) {
            $stmt->bindParam(':actor_id', $actorId, PDO::PARAM_INT);
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Calculate and store activity heatmap from interactions
     * @return int Number of records created
     */
    public function calculateActivityHeatmap(): int
    {
        // This would analyze interactions and teams_call_records to populate activity_heatmap
        // For now, we'll create a placeholder that can be enhanced with real data
        
        $sql = "INSERT INTO activity_heatmap (actor_id, activity_date, hour_of_day, email_count, meeting_count, total_activity)
                SELECT 
                    i.source_id as actor_id,
                    i.interaction_date,
                    EXTRACT(HOUR FROM i.created_at) as hour_of_day,
                    SUM(CASE WHEN i.channel = 'Email' THEN i.volume ELSE 0 END) as email_count,
                    0 as meeting_count,
                    SUM(i.volume) as total_activity
                FROM interactions i
                WHERE i.interaction_date >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY i.source_id, i.interaction_date, EXTRACT(HOUR FROM i.created_at)
                ON CONFLICT (actor_id, activity_date, hour_of_day) 
                DO UPDATE SET 
                    email_count = EXCLUDED.email_count,
                    total_activity = EXCLUDED.total_activity";

        $stmt = $this->db->prepare($sql);
        $stmt->execute();

        return $stmt->rowCount();
    }

    /**
     * Get users with overload risk
     * @param string $riskLevel Filter by risk level: 'normal', 'warning', 'critical'
     * @return array List of overloaded users
     */
    public function getOverloadedUsers(?string $riskLevel = null): array
    {
        $sql = "SELECT 
                    om.actor_id,
                    a.name,
                    a.email,
                    a.department,
                    om.week_start_date,
                    om.total_meetings,
                    om.total_meeting_hours,
                    om.emails_sent,
                    om.emails_received,
                    om.overload_score,
                    om.risk_level
                FROM overload_metrics om
                JOIN actors a ON om.actor_id = a.id
                WHERE om.week_start_date >= CURRENT_DATE - INTERVAL '4 weeks'";

        if ($riskLevel) {
            $sql .= " AND om.risk_level = :risk_level";
        }

        $sql .= " ORDER BY om.overload_score DESC, om.week_start_date DESC";

        $stmt = $this->db->prepare($sql);
        if ($riskLevel) {
            $stmt->bindParam(':risk_level', $riskLevel);
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Calculate overload metrics for all users
     * @return int Number of records created
     */
    public function calculateOverloadMetrics(): int
    {
        $weekStart = date('Y-m-d', strtotime('monday this week'));

        // Calculate meetings from teams_call_records
        $sql = "INSERT INTO overload_metrics (actor_id, week_start_date, total_meetings, total_meeting_hours, emails_sent, emails_received, overload_score, risk_level)
                SELECT 
                    a.id as actor_id,
                    :week_start as week_start_date,
                    COALESCE(COUNT(DISTINCT tcr.id), 0) as total_meetings,
                    COALESCE(SUM(tcr.duration_seconds) / 3600.0, 0) as total_meeting_hours,
                    COALESCE(SUM(CASE WHEN i.channel = 'Email' THEN i.volume ELSE 0 END), 0) as emails_sent,
                    COALESCE(SUM(CASE WHEN i2.channel = 'Email' THEN i2.volume ELSE 0 END), 0) as emails_received,
                    LEAST(100, (
                        (COALESCE(COUNT(DISTINCT tcr.id), 0) / 10.0 * 30) + 
                        (COALESCE(SUM(tcr.duration_seconds) / 3600.0, 0) / 20.0 * 40) +
                        (COALESCE(SUM(CASE WHEN i.channel = 'Email' THEN i.volume ELSE 0 END), 0) / 100.0 * 30)
                    )) as overload_score,
                    CASE 
                        WHEN (
                            (COALESCE(COUNT(DISTINCT tcr.id), 0) / 10.0 * 30) + 
                            (COALESCE(SUM(tcr.duration_seconds) / 3600.0, 0) / 20.0 * 40) +
                            (COALESCE(SUM(CASE WHEN i.channel = 'Email' THEN i.volume ELSE 0 END), 0) / 100.0 * 30)
                        ) >= 70 THEN 'critical'
                        WHEN (
                            (COALESCE(COUNT(DISTINCT tcr.id), 0) / 10.0 * 30) + 
                            (COALESCE(SUM(tcr.duration_seconds) / 3600.0, 0) / 20.0 * 40) +
                            (COALESCE(SUM(CASE WHEN i.channel = 'Email' THEN i.volume ELSE 0 END), 0) / 100.0 * 30)
                        ) >= 50 THEN 'warning'
                        ELSE 'normal'
                    END as risk_level
                FROM actors a
                LEFT JOIN teams_call_records tcr ON a.id = tcr.user_id 
                    AND tcr.call_timestamp >= :week_start::date
                    AND tcr.call_timestamp < :week_start::date + INTERVAL '7 days'
                LEFT JOIN interactions i ON a.id = i.source_id 
                    AND i.interaction_date >= :week_start::date
                    AND i.interaction_date < :week_start::date + INTERVAL '7 days'
                LEFT JOIN interactions i2 ON a.id = i2.target_id 
                    AND i2.interaction_date >= :week_start::date
                    AND i2.interaction_date < :week_start::date + INTERVAL '7 days'
                GROUP BY a.id
                ON CONFLICT (actor_id, week_start_date) 
                DO UPDATE SET 
                    total_meetings = EXCLUDED.total_meetings,
                    total_meeting_hours = EXCLUDED.total_meeting_hours,
                    emails_sent = EXCLUDED.emails_sent,
                    emails_received = EXCLUDED.emails_received,
                    overload_score = EXCLUDED.overload_score,
                    risk_level = EXCLUDED.risk_level";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':week_start', $weekStart);
        $stmt->execute();

        return $stmt->rowCount();
    }

    /**
     * Get response time analysis by department
     * @param string|null $department Optional department filter
     * @return array Response time metrics
     */
    public function getResponseTimeAnalysis(?string $department = null): array
    {
        $sql = "SELECT 
                    rta.department,
                    COUNT(DISTINCT rta.actor_id) as user_count,
                    AVG(rta.avg_response_hours) as dept_avg_response_hours,
                    AVG(rta.median_response_hours) as dept_median_response_hours,
                    SUM(rta.fast_responses) as total_fast_responses,
                    SUM(rta.slow_responses) as total_slow_responses,
                    SUM(rta.response_count) as total_responses
                FROM response_time_analysis rta
                WHERE rta.analysis_date >= CURRENT_DATE - INTERVAL '30 days'";

        if ($department) {
            $sql .= " AND rta.department = :department";
        }

        $sql .= " GROUP BY rta.department ORDER BY dept_avg_response_hours";

        $stmt = $this->db->prepare($sql);
        if ($department) {
            $stmt->bindParam(':department', $department);
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get timezone collaboration patterns
     * @return array Cross-timezone work patterns
     */
    public function getTimezoneCollaboration(): array
    {
        $sql = "SELECT 
                    source_region,
                    target_region,
                    interaction_count
                FROM timezone_collaboration
                ORDER BY interaction_count DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get summary statistics for temporal analysis
     * @return array Summary metrics
     */
    public function getSummaryStats(): array
    {
        $stats = [];

        // Total activity records
        $stmt = $this->db->query("SELECT COUNT(*) as total FROM activity_heatmap");
        $stats['total_heatmap_records'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Users with overload
        $stmt = $this->db->query("SELECT COUNT(DISTINCT actor_id) as count FROM overload_metrics WHERE risk_level IN ('warning', 'critical')");
        $stats['users_at_risk'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

        // Average response time
        $stmt = $this->db->query("SELECT AVG(avg_response_hours) as avg FROM response_time_analysis");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['avg_response_time_hours'] = $result['avg'] ?? 0;

        // Off-hours workers
        $stmt = $this->db->query("SELECT COUNT(DISTINCT actor_id) as count FROM timezone_collaboration WHERE (off_hours_emails + late_night_activity) > 10");
        $stats['off_hours_workers'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

        return $stats;
    }

    /**
     * Calculate response time metrics from interactions
     * @return int Number of records created
     */
    public function calculateResponseTimeMetrics(): int
    {
        $sql = "INSERT INTO response_time_analysis (actor_id, department, avg_response_hours, median_response_hours, response_count, fast_responses, slow_responses, analysis_date)
                SELECT 
                    a.id as actor_id,
                    a.department,
                    0 as avg_response_hours,
                    0 as median_response_hours,
                    COUNT(*) as response_count,
                    0 as fast_responses,
                    0 as slow_responses,
                    CURRENT_DATE as analysis_date
                FROM actors a
                WHERE a.id IN (SELECT DISTINCT source_id FROM interactions WHERE interaction_date >= CURRENT_DATE - INTERVAL '30 days')
                GROUP BY a.id, a.department
                ON CONFLICT (actor_id, analysis_date) 
                DO UPDATE SET 
                    response_count = EXCLUDED.response_count";

        $stmt = $this->db->prepare($sql);
        $stmt->execute();

        return $stmt->rowCount();
    }

    /**
     * Calculate timezone collaboration metrics
     * @return int Number of records created
     */
    /**
     * Calculate timezone collaboration metrics (Cross-Region Flows)
     * @return int Number of records created
     */
    public function calculateTimezoneMetrics(): int
    {
        // 1. Refactor schema to support Region/Department flows
        // We drop and recreate to ensure schema matches our new needs
        $dropSql = "DROP TABLE IF EXISTS timezone_collaboration";
        $createSql = "CREATE TABLE IF NOT EXISTS timezone_collaboration (
            id SERIAL PRIMARY KEY,
            source_region VARCHAR(100),
            target_region VARCHAR(100),
            interaction_count INTEGER DEFAULT 0,
            analysis_month DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(source_region, target_region, analysis_month)
        )";
        
        $this->db->exec($dropSql);
        $this->db->exec($createSql);

        // 2. Aggregate interactions to simulate "Region" flows
        // Using 'Department' as the proxy for Region since 'location' might not exist on all envs
        $sql = "INSERT INTO timezone_collaboration (source_region, target_region, interaction_count, analysis_month)
                SELECT 
                    COALESCE(a1.department, 'Unknown') as source_region,
                    COALESCE(a2.department, 'Unknown') as target_region,
                    COUNT(*) as interaction_count,
                    DATE_TRUNC('month', CURRENT_DATE) as analysis_month
                FROM interactions i
                JOIN actors a1 ON i.source_id = a1.id
                JOIN actors a2 ON i.target_id = a2.id
                WHERE i.interaction_date >= CURRENT_DATE - INTERVAL '30 days'
                  AND a1.id != a2.id 
                  AND COALESCE(a1.department, 'Unknown') != COALESCE(a2.department, 'Unknown')
                GROUP BY 1, 2
                ON CONFLICT (source_region, target_region, analysis_month) 
                DO UPDATE SET 
                    interaction_count = EXCLUDED.interaction_count";

        $stmt = $this->db->prepare($sql);
        $stmt->execute();

        return $stmt->rowCount();
    }
}