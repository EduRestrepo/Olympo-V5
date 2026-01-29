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
        $this->calculateChannelTotals();
        $this->calculateNetworkPulse();
        $this->calculateToneIndex();
    }

    private function calculateChannelTotals(): void
    {
        // Email Count
        $stmt = $this->db->query("SELECT SUM(volume) FROM interactions WHERE channel = 'Email'");
        $emailCount = (int)$stmt->fetchColumn();

        // Teams Count
        $stmt = $this->db->query("SELECT COUNT(*) FROM teams_call_records");
        $teamsCount = (int)$stmt->fetchColumn();

        // Upsert Email
        $this->upsertChannel('Email', $emailCount);
        // Upsert Teams
        $this->upsertChannel('Teams', $teamsCount);
    }

    private function upsertChannel(string $channel, int $count): void
    {
        // Simple Delete-Insert or Update
        // Check if exists
        $stmt = $this->db->prepare("SELECT id FROM channel_totals WHERE channel = :channel");
        $stmt->execute(['channel' => $channel]);
        $exists = $stmt->fetchColumn();

        if ($exists) {
            $upd = $this->db->prepare("UPDATE channel_totals SET total_count = :count WHERE channel = :channel");
            $upd->execute(['count' => $count, 'channel' => $channel]);
        } else {
            $ins = $this->db->prepare("INSERT INTO channel_totals (channel, total_count) VALUES (:channel, :count)");
            $ins->execute(['channel' => $channel, 'count' => $count]);
        }
    }

    private function calculateNetworkPulse(): void
    {
        // Aggregate Interactions by Day (Last 30 days)
        // Combine Email (interactions.created_at) and Teams (teams_call_records.call_timestamp)
        
        // Clear old pulse data? Or just upsert. Let's truncate and rebuild for simplicity/speed in this context
        // as we are aggregating history.
        $this->db->query("TRUNCATE TABLE network_pulse_daily");

        $sql = "
            INSERT INTO network_pulse_daily (date, activity_level)
            SELECT date, SUM(cnt) as activity_level FROM (
                SELECT DATE(created_at) as date, SUM(volume) as cnt FROM interactions GROUP BY DATE(created_at)
                UNION ALL
                SELECT DATE(call_timestamp) as date, COUNT(*) as cnt FROM teams_call_records GROUP BY DATE(call_timestamp)
            ) as combined
            WHERE date IS NOT NULL
            GROUP BY date
            ORDER BY date ASC
        ";
        $this->db->query($sql);
    }

    private function calculateToneIndex(): void
    {
        // Heuristic: 
        // Base score 100.
        // Penalty for escalations.
        // We need date of escalations. Currently `actors.escalation_score` is a total counter.
        // We don't have time-series for escalations easily unless we parse logs or add a table.
        // For now, let's use a proxy: "Response Time" from `interactions`.
        // High volume = High Energy? 
        // Let's make it random but stable for 'Showcase' purposes if we lack data, 
        // OR better: Use % of 'After Hours' activity if we had it.
        
        // Let's use: 100 - (Escalations / Total Volume * 1000)
        // Since we don't have daily escalations, we will generate a 'dummy' realistic trend based on volume 
        // for valid dates, just to show the chart.
        // REAL IMPLEMENTATION: Would require `escalation_events` table.
        
        $this->db->query("TRUNCATE TABLE tone_index_daily");
        
        // Generate Tone based on Pulse volume (Inverse relationship? High load = Stress?)
        $sql = "
            INSERT INTO tone_index_daily (date, score)
            SELECT 
                date, 
                GREATEST(60, 100 - (activity_level / 10.0)) as score -- Mock heuristic
            FROM network_pulse_daily
        ";
        $this->db->query($sql);
    }
}
