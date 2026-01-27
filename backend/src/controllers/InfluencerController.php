<?php

namespace Olympus\Controllers;

use Olympus\Db\Connection;
use Olympus\Services\ScoreCalculator;
use Symfony\Component\HttpFoundation\JsonResponse;

class InfluencerController
{
    private $db;
    private $calculator;

    public function __construct()
    {
        $this->db = Connection::get();
        $this->calculator = new ScoreCalculator();
    }

    public function getTopInfluencers(): JsonResponse
    {
        // Fetch Actors + Email Metrics + Teams Metrics
        $sql = "
            SELECT 
                a.id, a.name, a.role, a.badge, a.department, a.country, a.escalation_score,
                -- Email Metrics
                COALESCE(SUM(i.volume), 0) as total_volume,
                COALESCE(rt.avg_response_seconds, 0) as avg_response_time,
                (
                    SELECT channel 
                    FROM interactions i2 
                    WHERE i2.source_id = a.id 
                    GROUP BY channel 
                    ORDER BY SUM(volume) DESC 
                    LIMIT 1
                ) as email_dominant_channel,
                -- Teams Metrics (from view)
                COALESCE(tm.total_meetings, 0) as total_meetings,
                COALESCE(tm.avg_participants, 0) as avg_participants,
                COALESCE(tm.total_duration_hours, 0) as total_duration_hours,
                COALESCE(tm.meetings_organized, 0) as meetings_organized,
                COALESCE(tm.video_calls, 0) as video_calls,
                COALESCE(tm.screenshare_sessions, 0) as screenshare_sessions
            FROM actors a
            LEFT JOIN interactions i ON a.id = i.source_id
            LEFT JOIN response_times rt ON a.id = rt.actor_id
            LEFT JOIN teams_influence_metrics tm ON a.id = tm.id
            GROUP BY a.id, a.name, a.role, a.badge, a.department, a.country, a.escalation_score, rt.avg_response_seconds, 
                     tm.total_meetings, tm.avg_participants, tm.total_duration_hours,
                     tm.meetings_organized, tm.video_calls, tm.screenshare_sessions
        ";

        try {
            $stmt = $this->db->query($sql);
            $data = $stmt->fetchAll();

            // Calculate unified influence for each actor
            $processedData = [];
            foreach ($data as $actor) {
                $enrichedActor = $this->calculator->calculateUnifiedInfluence($actor);

                // Format response time
                $minutes = floor($enrichedActor['avg_response_time'] / 60);
                $seconds = $enrichedActor['avg_response_time'] % 60;
                $enrichedActor['avg_response_formatted'] = "{$minutes}m {$seconds}s";

                // Add detailed metrics breakdown
                $enrichedActor['email_metrics'] = [
                    'total_volume' => (int) $enrichedActor['total_volume'],
                    'avg_response_time' => (int) $enrichedActor['avg_response_time'],
                    'avg_response_formatted' => $enrichedActor['avg_response_formatted'],
                    'dominant_channel' => $enrichedActor['email_dominant_channel'] ?? 'N/A'
                ];

                $enrichedActor['teams_metrics'] = [
                    'total_meetings' => (int) $enrichedActor['total_meetings'],
                    'avg_participants' => round($enrichedActor['avg_participants'], 1),
                    'total_duration_hours' => round($enrichedActor['total_duration_hours'], 1),
                    'meetings_organized' => (int) $enrichedActor['meetings_organized'],
                    'video_calls' => (int) $enrichedActor['video_calls'],
                    'screenshare_sessions' => (int) $enrichedActor['screenshare_sessions'],
                    'organizer_ratio' => $enrichedActor['total_meetings'] > 0
                        ? round($enrichedActor['meetings_organized'] / $enrichedActor['total_meetings'], 2)
                        : 0,
                    'video_usage_ratio' => $enrichedActor['total_meetings'] > 0
                        ? round($enrichedActor['video_calls'] / $enrichedActor['total_meetings'], 2)
                        : 0
                ];

                $enrichedActor['score'] = $enrichedActor['unified_score']; // Alias for backward compatibility
                $processedData[] = $enrichedActor;
            }

            // Sort by unified score descending
            usort($processedData, fn($a, $b) => $b['unified_score'] <=> $a['unified_score']);

            // Add rank
            foreach ($processedData as $index => &$row) {
                $row['rank'] = $index + 1;
            }

            return new JsonResponse($processedData);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    public function getBalancePower(): JsonResponse
    {
        // Balance of power based on Badges
        // Distribution of Total Unified Score by Badge/Role

        try {
            // Get unified scores
            $data = json_decode($this->getTopInfluencers()->getContent(), true);

            $balance = [];
            $totalScore = 0;

            foreach ($data as $actor) {
                $badge = $actor['badge'];
                if (!isset($balance[$badge])) {
                    $balance[$badge] = ['name' => $badge, 'value' => 0];
                }
                $balance[$badge]['value'] += $actor['unified_score'];
                $totalScore += $actor['unified_score'];
            }

            return new JsonResponse(array_values($balance));
        } catch (\Exception $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    public function getInfluenceGraph(): JsonResponse
    {
        try {
            $stmt = $this->db->query("
                SELECT 
                    il.source_id as source, 
                    il.target_id as target, 
                    il.weight 
                FROM influence_links il
            ");
            $links = $stmt->fetchAll();

            $sql = "
                SELECT 
                    a.id, a.name, a.role, a.badge, a.department, a.country, a.escalation_score,
                    -- Email Metrics
                    COALESCE(SUM(i.volume), 0) as total_volume,
                    COALESCE(rt.avg_response_seconds, 0) as avg_response_time,
                    -- Teams Metrics
                    COALESCE(tm.total_meetings, 0) as total_meetings,
                    COALESCE(tm.avg_participants, 0) as avg_participants,
                    COALESCE(tm.total_duration_hours, 0) as total_duration_hours,
                    COALESCE(tm.meetings_organized, 0) as meetings_organized,
                    COALESCE(tm.video_calls, 0) as video_calls
                FROM actors a
                LEFT JOIN interactions i ON a.id = i.source_id
                LEFT JOIN response_times rt ON a.id = rt.actor_id
                LEFT JOIN teams_influence_metrics tm ON a.id = tm.id
                GROUP BY a.id, a.name, a.role, a.badge, a.department, a.country, a.escalation_score, rt.avg_response_seconds, 
                         tm.total_meetings, tm.avg_participants, tm.total_duration_hours,
                         tm.meetings_organized, tm.video_calls
            ";

            $stmtActors = $this->db->query($sql);
            $rawNodes = $stmtActors->fetchAll();

            $nodes = [];
            foreach ($rawNodes as $node) {
                $enriched = $this->calculator->calculateUnifiedInfluence($node);
                $nodes[] = $enriched;
            }

            return new JsonResponse([
                'nodes' => $nodes,
                'links' => $links
            ]);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }
}
