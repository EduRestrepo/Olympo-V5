<?php

namespace App\Services;

use PDO;

class BenchmarkingService
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Calculate department benchmarks
     * @return int Number of benchmarks calculated
     */
    public function calculateDepartmentBenchmarks(): int
    {
        $benchmarkDate = date('Y-m-d');

        // Clear old benchmarks for today
        $this->db->exec("DELETE FROM department_benchmarks WHERE benchmark_date = '$benchmarkDate'");

        $metrics = [
            'avg_response_time' => "AVG(rt.avg_response_seconds) / 3600.0",
            'collaboration_score' => "AVG(COALESCE((SELECT SUM(weight) FROM influence_links WHERE source_id = a.id), 0))",
            'meeting_hours' => "AVG(COALESCE((SELECT SUM(duration_seconds) / 3600.0 FROM teams_call_records WHERE user_id = a.id AND call_timestamp >= CURRENT_DATE - INTERVAL '30 days'), 0))",
            'email_volume' => "AVG(COALESCE((SELECT SUM(volume) FROM interactions WHERE source_id = a.id AND channel = 'Email' AND interaction_date >= CURRENT_DATE - INTERVAL '30 days'), 0))",
            'network_size' => "AVG(COALESCE((SELECT COUNT(DISTINCT target_id) FROM influence_links WHERE source_id = a.id), 0))"
        ];

        $count = 0;
        foreach ($metrics as $metricName => $metricFormula) {
            $sql = "WITH dept_metrics AS (
                        SELECT 
                            a.department,
                            $metricFormula as metric_value
                        FROM actors a
                        LEFT JOIN response_times rt ON a.id = rt.actor_id
                        WHERE a.department IS NOT NULL
                        GROUP BY a.department
                    ),
                    percentiles AS (
                        SELECT 
                            department,
                            metric_value,
                            PERCENT_RANK() OVER (ORDER BY metric_value) * 100 as percentile_rank
                        FROM dept_metrics
                    )
                    INSERT INTO department_benchmarks (department, metric_name, metric_value, percentile_rank, benchmark_date)
                    SELECT department, :metric_name, metric_value, percentile_rank, :benchmark_date
                    FROM percentiles";

            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':metric_name', $metricName);
            $stmt->bindParam(':benchmark_date', $benchmarkDate);
            $stmt->execute();
            $count += $stmt->rowCount();
        }

        return $count;
    }

    /**
     * Get department benchmarks
     * @param string|null $department Filter by department
     * @param string|null $metricName Filter by metric
     * @return array Benchmark data
     */
    public function getDepartmentBenchmarks(?string $department = null, ?string $metricName = null): array
    {
        $sql = "SELECT 
                    department,
                    metric_name,
                    metric_value,
                    percentile_rank,
                    benchmark_date
                FROM department_benchmarks
                WHERE benchmark_date >= CURRENT_DATE - INTERVAL '90 days'";

        if ($department) {
            $sql .= " AND department = :department";
        }

        if ($metricName) {
            $sql .= " AND metric_name = :metric_name";
        }

        $sql .= " ORDER BY benchmark_date DESC, department, metric_name";

        $stmt = $this->db->prepare($sql);
        if ($department) {
            $stmt->bindParam(':department', $department);
        }
        if ($metricName) {
            $stmt->bindParam(':metric_name', $metricName);
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Create temporal snapshot
     * @return bool Success
     */
    public function createTemporalSnapshot(): bool
    {
        $snapshotDate = date('Y-m-d');

        $sql = "INSERT INTO temporal_snapshots (
                    snapshot_date, total_actors, total_interactions, 
                    avg_influence_score, active_communities, network_density
                )
                SELECT 
                    :snapshot_date,
                    COUNT(DISTINCT a.id) as total_actors,
                    COUNT(DISTINCT i.id) as total_interactions,
                    AVG(COALESCE((SELECT SUM(weight) FROM influence_links WHERE source_id = a.id), 0)) as avg_influence_score,
                    (SELECT COUNT(DISTINCT id) FROM communities WHERE detection_date >= CURRENT_DATE - INTERVAL '7 days') as active_communities,
                    (SELECT COUNT(*) FROM influence_links)::float / NULLIF(COUNT(DISTINCT a.id) * (COUNT(DISTINCT a.id) - 1), 0) as network_density
                FROM actors a
                LEFT JOIN interactions i ON a.id = i.source_id AND i.interaction_date >= CURRENT_DATE - INTERVAL '30 days'
                ON CONFLICT (snapshot_date) DO UPDATE SET
                    total_actors = EXCLUDED.total_actors,
                    total_interactions = EXCLUDED.total_interactions,
                    avg_influence_score = EXCLUDED.avg_influence_score,
                    active_communities = EXCLUDED.active_communities,
                    network_density = EXCLUDED.network_density";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':snapshot_date', $snapshotDate);
        return $stmt->execute();
    }

    /**
     * Get temporal evolution
     * @param int $months Number of months to retrieve
     * @return array Temporal snapshots
     */
    public function getTemporalEvolution(int $months = 6): array
    {
        $sql = "SELECT 
                    snapshot_date,
                    total_actors,
                    total_interactions,
                    avg_influence_score,
                    active_communities,
                    network_density
                FROM temporal_snapshots
                WHERE snapshot_date >= CURRENT_DATE - INTERVAL ':months months'
                ORDER BY snapshot_date DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':months', $months, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Calculate rankings
     * @return int Number of rankings created
     */
    public function calculateRankings(): int
    {
        $rankingDate = date('Y-m-d');

        // Clear old rankings
        $this->db->exec("DELETE FROM rankings WHERE ranking_date = '$rankingDate'");

        $rankingTypes = [
            'top_collaborators' => "SELECT id, COALESCE((SELECT SUM(volume) FROM interactions WHERE source_id = a.id AND interaction_date >= CURRENT_DATE - INTERVAL '30 days'), 0) as score FROM actors a",
            'most_connected' => "SELECT id, COALESCE((SELECT COUNT(DISTINCT target_id) FROM influence_links WHERE source_id = a.id), 0) as score FROM actors a",
            'fastest_responders' => "SELECT a.id, COALESCE(3600.0 / NULLIF(rt.avg_response_seconds, 0), 0) as score FROM actors a LEFT JOIN response_times rt ON a.id = rt.actor_id",
            'meeting_organizers' => "SELECT user_id as id, COUNT(*) as score FROM teams_call_records WHERE is_organizer = TRUE AND call_timestamp >= CURRENT_DATE - INTERVAL '30 days' GROUP BY user_id",
            'bridge_connectors' => "SELECT actor_id as id, bridge_score as score FROM network_bridges WHERE detection_date >= CURRENT_DATE - INTERVAL '7 days'"
        ];

        $count = 0;
        foreach ($rankingTypes as $rankingType => $query) {
            $sql = "WITH ranked_actors AS (
                        SELECT 
                            id as actor_id,
                            score,
                            ROW_NUMBER() OVER (ORDER BY score DESC) as rank_position
                        FROM ($query) subq
                        WHERE score > 0
                    )
                    INSERT INTO rankings (ranking_type, actor_id, rank_position, score, ranking_date)
                    SELECT :ranking_type, actor_id, rank_position, score, :ranking_date
                    FROM ranked_actors
                    WHERE rank_position <= 50";

            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':ranking_type', $rankingType);
            $stmt->bindParam(':ranking_date', $rankingDate);
            $stmt->execute();
            $count += $stmt->rowCount();
        }

        return $count;
    }

    /**
     * Get rankings
     * @param string $rankingType Type of ranking
     * @param int $limit Number of results
     * @return array Ranking data
     */
    public function getRankings(string $rankingType, int $limit = 20): array
    {
        $sql = "SELECT 
                    r.rank_position,
                    r.actor_id,
                    a.name,
                    a.email,
                    a.department,
                    a.badge,
                    r.score,
                    r.ranking_date
                FROM rankings r
                JOIN actors a ON r.actor_id = a.id
                WHERE r.ranking_type = :ranking_type
                    AND r.ranking_date = (SELECT MAX(ranking_date) FROM rankings WHERE ranking_type = :ranking_type)
                ORDER BY r.rank_position
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':ranking_type', $rankingType);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get all available ranking types
     * @return array Ranking types with counts
     */
    public function getAvailableRankings(): array
    {
        $sql = "SELECT 
                    ranking_type,
                    COUNT(*) as total_ranked,
                    MAX(ranking_date) as last_updated
                FROM rankings
                GROUP BY ranking_type
                ORDER BY ranking_type";

        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
