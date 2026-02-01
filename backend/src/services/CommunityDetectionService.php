<?php

namespace App\Services;

use PDO;

class CommunityDetectionService
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Detect communities using simplified Louvain algorithm
     * @return array Detected communities
     */
    public function detectCommunities(): array
    {
        $detectionDate = date('Y-m-d');

        // Step 1: Get all actors and their connections
        $connections = $this->getNetworkConnections();
        
        // Step 2: Run community detection algorithm
        $communities = $this->louvainClustering($connections);
        
        // Step 3: Store communities in database
        $this->storeCommunities($communities, $detectionDate);
        
        return $this->getCommunities();
    }

    /**
     * Get network connections for community detection
     * @return array Network edges with weights
     */
    private function getNetworkConnections(): array
    {
        $sql = "SELECT 
                    il.source_id,
                    il.target_id,
                    il.weight
                FROM influence_links il
                WHERE il.weight > 0
                ORDER BY il.source_id, il.target_id";

        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Simplified Louvain clustering algorithm
     * @param array $connections Network edges
     * @return array Communities with members
     */
    private function louvainClustering(array $connections): array
    {
        // Initialize: each node in its own community
        $nodeCommunity = [];
        $nodes = [];

        foreach ($connections as $edge) {
            $nodes[$edge['source_id']] = true;
            $nodes[$edge['target_id']] = true;
        }

        $nodeIds = array_keys($nodes);
        foreach ($nodeIds as $nodeId) {
            $nodeCommunity[$nodeId] = $nodeId; // Each node starts in its own community
        }

        // Build adjacency list
        $adjacency = [];
        foreach ($connections as $edge) {
            $adjacency[$edge['source_id']][] = [
                'target' => $edge['target_id'],
                'weight' => $edge['weight']
            ];
            $adjacency[$edge['target_id']][] = [
                'target' => $edge['source_id'],
                'weight' => $edge['weight']
            ];
        }

        // Iterative optimization (simplified version)
        $improved = true;
        $iterations = 0;
        $maxIterations = 10;

        while ($improved && $iterations < $maxIterations) {
            $improved = false;
            $iterations++;

            foreach ($nodeIds as $nodeId) {
                $currentCommunity = $nodeCommunity[$nodeId];
                $bestCommunity = $currentCommunity;
                $bestGain = 0;

                // Try moving to neighbor communities
                if (isset($adjacency[$nodeId])) {
                    $neighborCommunities = [];
                    foreach ($adjacency[$nodeId] as $neighbor) {
                        $neighborCommunity = $nodeCommunity[$neighbor['target']];
                        if (!isset($neighborCommunities[$neighborCommunity])) {
                            $neighborCommunities[$neighborCommunity] = 0;
                        }
                        $neighborCommunities[$neighborCommunity] += $neighbor['weight'];
                    }

                    foreach ($neighborCommunities as $community => $weight) {
                        if ($community != $currentCommunity && $weight > $bestGain) {
                            $bestGain = $weight;
                            $bestCommunity = $community;
                        }
                    }
                }

                if ($bestCommunity != $currentCommunity) {
                    $nodeCommunity[$nodeId] = $bestCommunity;
                    $improved = true;
                }
            }
        }

        // Group nodes by community
        $communities = [];
        foreach ($nodeCommunity as $nodeId => $communityId) {
            if (!isset($communities[$communityId])) {
                $communities[$communityId] = [];
            }
            $communities[$communityId][] = $nodeId;
        }

        return $communities;
    }

    /**
     * Store detected communities in database
     * @param array $communities Communities with members
     * @param string $detectionDate Detection date
     */
    private function storeCommunities(array $communities, string $detectionDate): void
    {
        $communityIndex = 1;
        foreach ($communities as $communityId => $members) {
            if (count($members) < 2) continue; // Skip single-member communities

            // Insert community
            $sql = "INSERT INTO communities (name, description, member_count, detection_date)
                    VALUES (:name, :description, :member_count, :detection_date)
                    RETURNING id";

            $stmt = $this->db->prepare($sql);
            $name = "Comunidad " . $communityIndex;
            $description = "Comunidad detectada automáticamente con " . count($members) . " miembros";
            $memberCount = count($members);

            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':description', $description);
            $stmt->bindParam(':member_count', $memberCount, PDO::PARAM_INT);
            $stmt->bindParam(':detection_date', $detectionDate);
            $stmt->execute();

            $newCommunityId = $stmt->fetchColumn();

            // Insert community members
            foreach ($members as $actorId) {
                $sql = "INSERT INTO community_members (community_id, actor_id, membership_strength, is_core_member)
                        VALUES (:community_id, :actor_id, 0.8, TRUE)
                        ON CONFLICT (community_id, actor_id) DO NOTHING";

                $stmt = $this->db->prepare($sql);
                $stmt->bindParam(':community_id', $newCommunityId, PDO::PARAM_INT);
                $stmt->bindParam(':actor_id', $actorId, PDO::PARAM_INT);
                $stmt->execute();
            }

            $communityIndex++;
        }
    }

    /**
     * Get all detected communities
     * @return array Communities with members
     */
    public function getCommunities(): array
    {
        $sql = "SELECT 
                    c.id,
                    c.name,
                    c.description,
                    c.member_count,
                    c.avg_internal_connections,
                    c.modularity_score,
                    c.detection_date,
                    json_agg(json_build_object(
                        'actor_id', cm.actor_id,
                        'actor_name', a.name,
                        'department', a.department,
                        'membership_strength', cm.membership_strength,
                        'is_core_member', cm.is_core_member
                    )) as members
                FROM communities c
                LEFT JOIN community_members cm ON c.id = cm.community_id
                LEFT JOIN actors a ON cm.actor_id = a.id
                WHERE c.detection_date = (SELECT MAX(detection_date) FROM communities)
                GROUP BY c.id
                ORDER BY c.member_count DESC";

        $stmt = $this->db->query($sql);
        $communities = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode JSON members
        foreach ($communities as &$community) {
            $community['members'] = json_decode($community['members'], true);
        }

        return $communities;
    }

    /**
     * Detect organizational silos
     * @return array Detected silos
     */
    public function detectSilos(): array
    {
        $detectionDate = date('Y-m-d');

        // Calculate silo metrics for each department
        $sql = "WITH dept_connections AS (
                    SELECT 
                        a1.department,
                        COUNT(CASE WHEN a2.department = a1.department THEN 1 END) as internal_connections,
                        COUNT(CASE WHEN a2.department != a1.department THEN 1 END) as external_connections
                    FROM influence_links il
                    JOIN actors a1 ON il.source_id = a1.id
                    JOIN actors a2 ON il.target_id = a2.id
                    WHERE a1.department IS NOT NULL AND a2.department IS NOT NULL
                    GROUP BY a1.department
                )
                INSERT INTO organizational_silos (department, isolation_score, internal_connections, external_connections, silo_risk, detection_date)
                SELECT 
                    department,
                    CASE 
                        WHEN (internal_connections + external_connections) = 0 THEN 100
                        ELSE LEAST(100, (internal_connections::float / NULLIF(external_connections, 0)) * 20)
                    END as isolation_score,
                    internal_connections,
                    external_connections,
                    CASE 
                        WHEN (internal_connections::float / NULLIF(external_connections, 0)) > 5 THEN 'high'
                        WHEN (internal_connections::float / NULLIF(external_connections, 0)) > 2 THEN 'medium'
                        ELSE 'low'
                    END as silo_risk,
                    :detection_date
                FROM dept_connections
                ON CONFLICT DO NOTHING";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':detection_date', $detectionDate);
        $stmt->execute();

        return $this->getSilos();
    }

    /**
     * Get organizational silos
     * @param string|null $riskLevel Filter by risk level
     * @return array Silos
     */
    public function getSilos(?string $riskLevel = null): array
    {
        $sql = "SELECT 
                    department,
                    isolation_score,
                    internal_connections,
                    external_connections,
                    silo_risk,
                    detection_date
                FROM organizational_silos
                WHERE detection_date >= CURRENT_DATE - INTERVAL '30 days'";

        if ($riskLevel) {
            $sql .= " AND silo_risk = :risk_level";
        }

        $sql .= " ORDER BY isolation_score DESC";

        $stmt = $this->db->prepare($sql);
        if ($riskLevel) {
            $stmt->bindParam(':risk_level', $riskLevel);
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Detect network bridges (key connectors)
     * @return array Bridge users
     */
    public function detectBridges(): array
    {
        $detectionDate = date('Y-m-d');

        // Calculate betweenness centrality (simplified version)
        $sql = "WITH actor_connections AS (
                    SELECT 
                        a.id as actor_id,
                        COUNT(DISTINCT CASE WHEN cm1.community_id IS NOT NULL THEN cm1.community_id END) as communities_connected,
                        COUNT(DISTINCT il.target_id) as total_connections
                    FROM actors a
                    LEFT JOIN influence_links il ON a.id = il.source_id
                    LEFT JOIN community_members cm1 ON a.id = cm1.actor_id
                    GROUP BY a.id
                )
                INSERT INTO network_bridges (actor_id, betweenness_centrality, communities_connected, bridge_score, detection_date)
                SELECT 
                    actor_id,
                    total_connections::float / NULLIF((SELECT MAX(total_connections) FROM actor_connections), 0) as betweenness_centrality,
                    communities_connected,
                    LEAST(100, communities_connected * 25 + (total_connections::float / NULLIF((SELECT MAX(total_connections) FROM actor_connections), 0)) * 50) as bridge_score,
                    :detection_date
                FROM actor_connections
                WHERE communities_connected >= 2
                ON CONFLICT (actor_id, detection_date) 
                DO UPDATE SET 
                    betweenness_centrality = EXCLUDED.betweenness_centrality,
                    communities_connected = EXCLUDED.communities_connected,
                    bridge_score = EXCLUDED.bridge_score";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':detection_date', $detectionDate);
        $stmt->execute();

        return $this->getBridges();
    }

    /**
     * Get network bridges
     * @param int $limit Number of top bridges to return
     * @return array Bridge users
     */
    public function getBridges(int $limit = 20): array
    {
        $sql = "SELECT 
                    nb.actor_id,
                    a.name,
                    a.email,
                    a.department,
                    a.badge,
                    nb.betweenness_centrality,
                    nb.communities_connected,
                    nb.bridge_score,
                    nb.detection_date
                FROM network_bridges nb
                JOIN actors a ON nb.actor_id = a.id
                WHERE nb.detection_date = (SELECT MAX(detection_date) FROM network_bridges)
                ORDER BY nb.bridge_score DESC
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get network diversity metrics
     * @return array Diversity metrics
     */
    public function getNetworkDiversity(): array
    {
        $sql = "SELECT 
                    a.id as actor_id,
                    a.name,
                    a.department,
                    COUNT(DISTINCT a2.department) as unique_departments_connected,
                    COUNT(DISTINCT a2.country) as unique_countries_connected,
                    COUNT(DISTINCT il.target_id) as total_connections,
                    CASE 
                        WHEN COUNT(DISTINCT il.target_id) = 0 THEN 0
                        ELSE (COUNT(DISTINCT a2.department)::float / COUNT(DISTINCT il.target_id)) * 100
                    END as diversity_score
                FROM actors a
                LEFT JOIN influence_links il ON a.id = il.source_id
                LEFT JOIN actors a2 ON il.target_id = a2.id
                GROUP BY a.id, a.name, a.department
                HAVING COUNT(DISTINCT il.target_id) > 0
                ORDER BY diversity_score DESC";

        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
