<?php

namespace App\Services;

use PDO;

class GamificationService
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Check and award badges to users
     * @return int Number of badges awarded
     */
    public function awardBadges(): int
    {
        $badgesAwarded = 0;

        // Get all badge criteria
        $sql = "SELECT id, badge_name, criteria FROM achievement_badges";
        $stmt = $this->db->query($sql);
        $badges = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($badges as $badge) {
            $criteria = json_decode($badge['criteria'], true);
            $eligibleUsers = $this->getEligibleUsers($criteria);

            foreach ($eligibleUsers as $userId) {
                // Award badge if not already earned
                $sql = "INSERT INTO badges_earned (actor_id, badge_id, earned_date)
                        VALUES (:actor_id, :badge_id, CURRENT_DATE)
                        ON CONFLICT (actor_id, badge_id) DO NOTHING";

                $stmt = $this->db->prepare($sql);
                $stmt->bindParam(':actor_id', $userId, PDO::PARAM_INT);
                $stmt->bindParam(':badge_id', $badge['id'], PDO::PARAM_INT);
                $stmt->execute();

                if ($stmt->rowCount() > 0) {
                    $badgesAwarded++;
                }
            }
        }

        return $badgesAwarded;
    }

    /**
     * Get users eligible for badge based on criteria
     * @param array $criteria Badge criteria
     * @return array User IDs
     */
    private function getEligibleUsers(array $criteria): array
    {
        $users = [];

        if (isset($criteria['min_connections'])) {
            $sql = "SELECT a.id FROM actors a
                    WHERE (SELECT COUNT(*) FROM influence_links WHERE source_id = a.id) >= :min_connections";
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':min_connections', $criteria['min_connections'], PDO::PARAM_INT);
            $stmt->execute();
            $users = array_merge($users, $stmt->fetchAll(PDO::FETCH_COLUMN));
        }

        if (isset($criteria['max_avg_response_hours'])) {
            $sql = "SELECT a.id FROM actors a
                    JOIN response_times rt ON a.id = rt.actor_id
                    WHERE rt.avg_response_seconds / 3600.0 <= :max_hours";
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':max_hours', $criteria['max_avg_response_hours']);
            $stmt->execute();
            $users = array_merge($users, $stmt->fetchAll(PDO::FETCH_COLUMN));
        }

        if (isset($criteria['min_meetings'])) {
            $sql = "SELECT user_id as id FROM teams_call_records
                    WHERE call_timestamp >= CURRENT_DATE - INTERVAL '30 days'
                    GROUP BY user_id
                    HAVING COUNT(*) >= :min_meetings";
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':min_meetings', $criteria['min_meetings'], PDO::PARAM_INT);
            $stmt->execute();
            $users = array_merge($users, $stmt->fetchAll(PDO::FETCH_COLUMN));
        }

        return array_unique($users);
    }

    /**
     * Get badges earned by user
     * @param int $actorId User ID
     * @return array Earned badges
     */
    public function getUserBadges(int $actorId): array
    {
        $sql = "SELECT 
                    ab.badge_name, ab.badge_description, ab.badge_icon, 
                    ab.points, ab.rarity, be.earned_date
                FROM badges_earned be
                JOIN achievement_badges ab ON be.badge_id = ab.id
                WHERE be.actor_id = :actor_id
                ORDER BY be.earned_date DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':actor_id', $actorId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Generate connection suggestions for user
     * @param int $actorId User ID
     * @param int $limit Number of suggestions
     * @return int Number of suggestions created
     */
    public function generateConnectionSuggestions(int $actorId, int $limit = 5): int
    {
        // Find users with shared connections but not directly connected
        $sql = "WITH user_connections AS (
                    SELECT target_id FROM influence_links WHERE source_id = :actor_id
                ),
                potential_connections AS (
                    SELECT 
                        il.target_id as suggested_id,
                        COUNT(*) as shared_connections,
                        AVG(il.weight) as relevance_score
                    FROM influence_links il
                    WHERE il.source_id IN (SELECT target_id FROM user_connections)
                        AND il.target_id != :actor_id
                        AND il.target_id NOT IN (SELECT target_id FROM user_connections)
                    GROUP BY il.target_id
                    ORDER BY shared_connections DESC, relevance_score DESC
                    LIMIT :limit
                )
                INSERT INTO connection_suggestions (actor_id, suggested_actor_id, suggestion_reason, shared_connections, relevance_score, suggested_date)
                SELECT 
                    :actor_id,
                    suggested_id,
                    'Tienes ' || shared_connections || ' conexiones en común',
                    shared_connections,
                    relevance_score,
                    CURRENT_DATE
                FROM potential_connections
                ON CONFLICT (actor_id, suggested_actor_id) DO UPDATE SET
                    shared_connections = EXCLUDED.shared_connections,
                    relevance_score = EXCLUDED.relevance_score,
                    suggested_date = CURRENT_DATE";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':actor_id', $actorId, PDO::PARAM_INT);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->rowCount();
    }

    /**
     * Get connection suggestions for user
     * @param int $actorId User ID
     * @param string|null $status Filter by status
     * @return array Suggestions
     */
    public function getConnectionSuggestions(int $actorId, ?string $status = 'pending'): array
    {
        $sql = "SELECT 
                    cs.id, cs.suggested_actor_id,
                    a.name as suggested_name, a.email as suggested_email,
                    a.department, a.badge,
                    cs.suggestion_reason, cs.shared_connections,
                    cs.relevance_score, cs.status, cs.suggested_date
                FROM connection_suggestions cs
                JOIN actors a ON cs.suggested_actor_id = a.id
                WHERE cs.actor_id = :actor_id";

        if ($status) {
            $sql .= " AND cs.status = :status";
        }

        $sql .= " ORDER BY cs.relevance_score DESC, cs.shared_connections DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':actor_id', $actorId, PDO::PARAM_INT);
        if ($status) {
            $stmt->bindParam(':status', $status);
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Create network goal for user
     * @param int $actorId User ID
     * @param array $goalData Goal configuration
     * @return int Goal ID
     */
    public function createNetworkGoal(int $actorId, array $goalData): int
    {
        $sql = "INSERT INTO network_goals (actor_id, goal_type, goal_description, target_value, deadline)
                VALUES (:actor_id, :goal_type, :goal_description, :target_value, :deadline)
                RETURNING id";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':actor_id', $actorId, PDO::PARAM_INT);
        $stmt->bindParam(':goal_type', $goalData['goal_type']);
        $stmt->bindParam(':goal_description', $goalData['goal_description']);
        $stmt->bindParam(':target_value', $goalData['target_value']);
        $stmt->bindParam(':deadline', $goalData['deadline']);
        $stmt->execute();

        return $stmt->fetchColumn();
    }

    /**
     * Update network goal progress
     * @param int $goalId Goal ID
     * @return bool Success
     */
    public function updateGoalProgress(int $goalId): bool
    {
        // Get goal details
        $sql = "SELECT actor_id, goal_type, target_value FROM network_goals WHERE id = :goal_id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':goal_id', $goalId, PDO::PARAM_INT);
        $stmt->execute();
        $goal = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$goal) {
            return false;
        }

        // Calculate current value based on goal type
        $currentValue = $this->calculateGoalValue($goal['actor_id'], $goal['goal_type']);

        // Update progress
        $progressPct = min(100, ($currentValue / $goal['target_value']) * 100);
        $status = $progressPct >= 100 ? 'completed' : 'active';

        $sql = "UPDATE network_goals 
                SET current_value = :current_value, 
                    progress_pct = :progress_pct,
                    status = :status
                WHERE id = :goal_id";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':current_value', $currentValue);
        $stmt->bindParam(':progress_pct', $progressPct);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':goal_id', $goalId, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Calculate current goal value
     * @param int $actorId User ID
     * @param string $goalType Goal type
     * @return float Current value
     */
    private function calculateGoalValue(int $actorId, string $goalType): float
    {
        switch ($goalType) {
            case 'expand_network':
                $sql = "SELECT COUNT(*) FROM influence_links WHERE source_id = :actor_id";
                break;
            case 'cross_department':
                $sql = "SELECT COUNT(DISTINCT a2.department) 
                        FROM influence_links il
                        JOIN actors a2 ON il.target_id = a2.id
                        WHERE il.source_id = :actor_id";
                break;
            case 'response_time':
                $sql = "SELECT avg_response_seconds / 3600.0 FROM response_times WHERE actor_id = :actor_id";
                break;
            default:
                return 0;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':actor_id', $actorId, PDO::PARAM_INT);
        $stmt->execute();

        return (float) $stmt->fetchColumn();
    }

    /**
     * Get user's network goals
     * @param int $actorId User ID
     * @param string|null $status Filter by status
     * @return array Goals
     */
    public function getUserGoals(int $actorId, ?string $status = 'active'): array
    {
        $sql = "SELECT * FROM network_goals WHERE actor_id = :actor_id";

        if ($status) {
            $sql .= " AND status = :status";
        }

        $sql .= " ORDER BY created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':actor_id', $actorId, PDO::PARAM_INT);
        if ($status) {
            $stmt->bindParam(':status', $status);
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
