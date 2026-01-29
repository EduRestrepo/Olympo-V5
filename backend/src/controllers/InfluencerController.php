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
        $repo = new \Olympus\Db\SettingRepository();

        // 1. Allowed Domains Filter
        $allowedDomainsStr = $repo->getByKey('allowed_domains', '');
        $allowedDomains = [];
        if (!empty($allowedDomainsStr)) {
            $allowedDomains = array_map('trim', explode(',', strtolower($allowedDomainsStr)));
        }

        // 2. Excluded Users Filter
        $excludedUsersStr = $repo->getByKey('excluded_users', '');
        $excludedUsers = [];
        if (!empty($excludedUsersStr)) {
            $excludedUsers = array_map('trim', explode(',', strtolower($excludedUsersStr)));
        }

        $filters = [];

        // Apply Domain Filter
        if (!empty($allowedDomains)) {
            $clauses = [];
            foreach ($allowedDomains as $domain) {
                $d = ltrim($domain, '@');
                $clauses[] = "LOWER(a.email) LIKE '%@$d'";
            }
            if (!empty($clauses)) {
                $filters[] = "(" . implode(' OR ', $clauses) . ")";
            }
        }

        // Apply Excluded Users Filter
        if (!empty($excludedUsers)) {
             $excludes = [];
             foreach ($excludedUsers as $email) {
                 // Sanitize simple email check
                 $excludes[] = "LOWER(a.email) != '" . str_replace("'", "''", $email) . "'";
             }
             if (!empty($excludes)) {
                 $filters[] = "(" . implode(' AND ', $excludes) . ")";
             }
        }

        $whereClause = "";
        if (!empty($filters)) {
            $whereClause = "WHERE " . implode(' AND ', $filters);
        }

        // Fetch Actors + Email Metrics + Teams Metrics
        $sql = "
            SELECT 
                a.id, a.name, a.role, a.badge, a.department, a.country, a.escalation_score, a.email,
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
            $whereClause
            GROUP BY a.id, a.name, a.role, a.badge, a.department, a.country, a.escalation_score, a.email, rt.avg_response_seconds, 
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

            // ASSIGN BADGES
            // We do this here so the next fetch reflects it, or we could update the response object directly too.
            // For immediate UI update without refresh, we update the array $row['badge'] as well.
            $badgeService = new \Olympus\Services\BadgeService();
            $badgeService->assignBadges($processedData);
            
            // Re-fetch badges or just simulate it for response?
            // Let's simulate for response consistency so UI shows it immediately
            foreach ($processedData as &$row) {
                 // Re-calculate simply for display to match what DB just got
                 // Or better, let BadgeService return the map.
                 // For simplicity/speed:
                 $rank = $row['rank'];
                 $total = count($processedData);
                 if ($rank === 1) $row['badge'] = '♚';
                 elseif ($rank <= 3) $row['badge'] = '♛';
                 elseif ($rank <= 10) $row['badge'] = '♜';
                 elseif (($rank/$total)*100 <= 15) $row['badge'] = '♗';
                 elseif (($rank/$total)*100 <= 30) $row['badge'] = '♞';
                 else $row['badge'] = '♙';
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
            $request = \Symfony\Component\HttpFoundation\Request::createFromGlobals();
            $limit = $request->query->get('limit', 50); // Default 50 nodes
            $minWeight = $request->query->get('min_weight', 1); // Default weight 1

             $repo = new \Olympus\Db\SettingRepository();

            // 1. Allowed Domains Filter
            $allowedDomainsStr = $repo->getByKey('allowed_domains', '');
            $allowedDomains = [];
            if (!empty($allowedDomainsStr)) {
                $allowedDomains = array_map('trim', explode(',', strtolower($allowedDomainsStr)));
            }

            // 2. Excluded Users Filter
            $excludedUsersStr = $repo->getByKey('excluded_users', '');
            $excludedUsers = [];
            if (!empty($excludedUsersStr)) {
                $excludedUsers = array_map('trim', explode(',', strtolower($excludedUsersStr)));
            }

            $filters = [];

            // Apply Domain Filter
            if (!empty($allowedDomains)) {
                $clauses = [];
                foreach ($allowedDomains as $domain) {
                    $d = ltrim($domain, '@');
                    $clauses[] = "LOWER(a.email) LIKE '%@$d'";
                }
                if (!empty($clauses)) {
                    $filters[] = "(" . implode(' OR ', $clauses) . ")";
                }
            }

            // Apply Excluded Users Filter
            if (!empty($excludedUsers)) {
                 $excludes = [];
                 foreach ($excludedUsers as $email) {
                     $excludes[] = "LOWER(a.email) != '" . str_replace("'", "''", $email) . "'";
                 }
                 if (!empty($excludes)) {
                     $filters[] = "(" . implode(' AND ', $excludes) . ")";
                 }
            }

            $whereClause = "";
            if (!empty($filters)) {
                $whereClause = "WHERE " . implode(' AND ', $filters);
            }

            // 1. Fetch Top N Actors first
            $sqlActors = "
                SELECT 
                    a.id, a.name, a.role, a.badge, a.department, a.country, a.escalation_score, a.email,
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
                $whereClause
                GROUP BY a.id, a.name, a.role, a.badge, a.department, a.country, a.escalation_score, a.email, rt.avg_response_seconds, 
                         tm.total_meetings, tm.avg_participants, tm.total_duration_hours,
                         tm.meetings_organized, tm.video_calls
                -- Order by total volume mainly for graph relevance
                ORDER BY (COALESCE(SUM(i.volume), 0) + COALESCE(tm.total_meetings, 0)) DESC
                LIMIT :limit
            ";

            $stmtActors = $this->db->prepare($sqlActors);
            $stmtActors->bindValue(':limit', (int)$limit, \PDO::PARAM_INT);
            $stmtActors->execute();
            $rawNodes = $stmtActors->fetchAll();

            $nodes = [];
            $nodeIds = [];
            foreach ($rawNodes as $node) {
                $enriched = $this->calculator->calculateUnifiedInfluence($node);
                $nodes[] = $enriched;
                $nodeIds[] = $node['id'];
            }

            if (empty($nodeIds)) {
                return new JsonResponse(['nodes' => [], 'links' => []]);
            }

            // 2. Fetch Links ONLY between these Top N Actors and above min_weight
            $placeholders = implode(',', $nodeIds); // Safe since IDs are integers from DB
            
            // We need to fetch links where BOTH source and target are in the top selection
            $sqlLinks = "
                SELECT 
                    source_id as source, 
                    target_id as target, 
                    volume as weight 
                FROM interactions
                WHERE volume >= :min_weight
                AND source_id IN ($placeholders)
                AND target_id IN ($placeholders)
            ";
            
            $stmtLinks = $this->db->prepare($sqlLinks);
            $stmtLinks->bindValue(':min_weight', (int)$minWeight, \PDO::PARAM_INT);
            $stmtLinks->execute();
            $links = $stmtLinks->fetchAll();

            return new JsonResponse([
                'nodes' => $nodes,
                'links' => $links,
                'meta' => [
                    'limit' => (int)$limit,
                    'min_weight' => (int)$minWeight,
                    'total_nodes' => count($nodes),
                    'total_links' => count($links)
                ]
            ]);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }
}
