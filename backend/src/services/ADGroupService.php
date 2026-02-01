<?php

namespace Olympus\Services;

use PDO;

/**
 * Active Directory Group Service
 * Handles AD group filtering and selective user extraction
 */
class ADGroupService
{
    private PDO $db;
    private $graphClient; // Microsoft Graph API client

    public function __construct(PDO $db, $graphClient = null)
    {
        $this->db = $db;
        $this->graphClient = $graphClient;
    }

    /**
     * Sync AD groups from Microsoft Graph
     * @return int Number of groups synced
     */
    public function syncADGroups(): int
    {
        if (!$this->graphClient) {
            throw new \Exception("Graph client not configured");
        }

        try {
            // Fetch groups from Microsoft Graph
            $groups = $this->graphClient->createRequest('GET', '/groups')
                ->setReturnType(\Microsoft\Graph\Model\Group::class)
                ->execute();

            $syncedCount = 0;

            foreach ($groups as $group) {
                // Insert or update group
                $sql = "INSERT INTO ad_groups (group_id, group_name, display_name, description, last_synced)
                        VALUES (:group_id, :group_name, :display_name, :description, CURRENT_TIMESTAMP)
                        ON CONFLICT (group_id) DO UPDATE SET
                            group_name = EXCLUDED.group_name,
                            display_name = EXCLUDED.display_name,
                            description = EXCLUDED.description,
                            last_synced = CURRENT_TIMESTAMP";

                $stmt = $this->db->prepare($sql);
                $stmt->bindValue(':group_id', $group->getId());
                $stmt->bindValue(':group_name', $group->getMailNickname() ?? $group->getDisplayName());
                $stmt->bindValue(':display_name', $group->getDisplayName());
                $stmt->bindValue(':description', $group->getDescription());
                $stmt->execute();

                $syncedCount++;
            }

            return $syncedCount;

        } catch (\Exception $e) {
            error_log("Error syncing AD groups: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Sync members of a specific AD group
     * @param string $groupId Azure AD Group Object ID
     * @return int Number of members synced
     */
    public function syncGroupMembers(string $groupId): int
    {
        if (!$this->graphClient) {
            throw new \Exception("Graph client not configured");
        }

        // Get internal group ID
        $sql = "SELECT id FROM ad_groups WHERE group_id = :group_id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':group_id', $groupId);
        $stmt->execute();
        $group = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$group) {
            throw new \Exception("Group not found: $groupId");
        }

        $internalGroupId = $group['id'];

        try {
            // Fetch group members from Microsoft Graph
            $members = $this->graphClient->createRequest('GET', "/groups/$groupId/members")
                ->setReturnType(\Microsoft\Graph\Model\User::class)
                ->execute();

            // Clear existing members
            $sql = "DELETE FROM ad_group_members WHERE group_id = :group_id";
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':group_id', $internalGroupId, PDO::PARAM_INT);
            $stmt->execute();

            $syncedCount = 0;

            foreach ($members as $member) {
                // Find actor by email
                $email = $member->getMail() ?? $member->getUserPrincipalName();
                
                $sql = "SELECT id FROM actors WHERE email = :email";
                $stmt = $this->db->prepare($sql);
                $stmt->bindParam(':email', $email);
                $stmt->execute();
                $actor = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($actor) {
                    // Insert group member
                    $sql = "INSERT INTO ad_group_members (group_id, actor_id)
                            VALUES (:group_id, :actor_id)
                            ON CONFLICT (group_id, actor_id) DO NOTHING";

                    $stmt = $this->db->prepare($sql);
                    $stmt->bindParam(':group_id', $internalGroupId, PDO::PARAM_INT);
                    $stmt->bindParam(':actor_id', $actor['id'], PDO::PARAM_INT);
                    $stmt->execute();

                    $syncedCount++;
                }
            }

            // Update member count
            $sql = "UPDATE ad_groups SET member_count = :count WHERE id = :group_id";
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':count', $syncedCount, PDO::PARAM_INT);
            $stmt->bindParam(':group_id', $internalGroupId, PDO::PARAM_INT);
            $stmt->execute();

            return $syncedCount;

        } catch (\Exception $e) {
            error_log("Error syncing group members: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get all AD groups
     * @param bool|null $isEnabled Filter by enabled status
     * @return array Groups list
     */
    public function getADGroups(?bool $isEnabled = null): array
    {
        $sql = "SELECT 
                    id,
                    group_id,
                    group_name,
                    display_name,
                    description,
                    member_count,
                    is_enabled,
                    last_synced
                FROM ad_groups";

        if ($isEnabled !== null) {
            $sql .= " WHERE is_enabled = :is_enabled";
        }

        $sql .= " ORDER BY display_name";

        $stmt = $this->db->prepare($sql);
        if ($isEnabled !== null) {
            $stmt->bindParam(':is_enabled', $isEnabled, PDO::PARAM_BOOL);
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get members of an AD group
     * @param int $groupId Internal group ID
     * @return array Group members
     */
    public function getGroupMembers(int $groupId): array
    {
        $sql = "SELECT 
                    a.id,
                    a.name,
                    a.email,
                    a.department,
                    a.role,
                    a.badge,
                    agm.added_at
                FROM ad_group_members agm
                JOIN actors a ON agm.actor_id = a.id
                WHERE agm.group_id = :group_id
                ORDER BY a.name";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':group_id', $groupId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Create extraction scope
     * @param array $config Scope configuration
     * @return int Scope ID
     */
    public function createExtractionScope(array $config): int
    {
        $sql = "INSERT INTO extraction_scopes (scope_name, scope_type, filter_config, is_active)
                VALUES (:scope_name, :scope_type, :filter_config, TRUE)
                RETURNING id";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':scope_name', $config['scope_name']);
        $stmt->bindParam(':scope_type', $config['scope_type']);
        $filterConfigJson = json_encode($config['filter_config'] ?? []);
        $stmt->bindParam(':filter_config', $filterConfigJson);
        $stmt->execute();

        $scopeId = $stmt->fetchColumn();

        // Calculate user count
        $this->updateScopeUserCount($scopeId);

        return $scopeId;
    }

    /**
     * Get extraction scopes
     * @param bool|null $isActive Filter by active status
     * @return array Scopes list
     */
    public function getExtractionScopes(?bool $isActive = null): array
    {
        $sql = "SELECT 
                    id,
                    scope_name,
                    scope_type,
                    filter_config,
                    user_count,
                    is_active,
                    created_at
                FROM extraction_scopes";

        if ($isActive !== null) {
            $sql .= " WHERE is_active = :is_active";
        }

        $sql .= " ORDER BY created_at DESC";

        $stmt = $this->db->prepare($sql);
        if ($isActive !== null) {
            $stmt->bindParam(':is_active', $isActive, PDO::PARAM_BOOL);
        }
        $stmt->execute();

        $scopes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode filter_config
        foreach ($scopes as &$scope) {
            $scope['filter_config'] = json_decode($scope['filter_config'], true);
        }

        return $scopes;
    }

    /**
     * Get users for extraction scope
     * @param int $scopeId Scope ID
     * @param int $limit Limit results
     * @param int $offset Offset for pagination
     * @return array Users matching scope
     */
    public function getUsersForScope(int $scopeId, int $limit = 100, int $offset = 0): array
    {
        // Get scope configuration
        $sql = "SELECT scope_type, filter_config FROM extraction_scopes WHERE id = :scope_id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':scope_id', $scopeId, PDO::PARAM_INT);
        $stmt->execute();
        $scope = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$scope) {
            return [];
        }

        $filterConfig = json_decode($scope['filter_config'], true);

        // Build query based on scope type
        $sql = "SELECT DISTINCT a.id, a.name, a.email, a.department, a.role FROM actors a";

        switch ($scope['scope_type']) {
            case 'ad_group':
                $sql .= " JOIN ad_group_members agm ON a.id = agm.actor_id
                          WHERE agm.group_id = :group_id";
                break;

            case 'department':
                $sql .= " WHERE a.department = :department";
                break;

            case 'custom_filter':
                // Apply custom filters from config
                $conditions = [];
                if (isset($filterConfig['departments'])) {
                    $conditions[] = "a.department IN ('" . implode("','", $filterConfig['departments']) . "')";
                }
                if (isset($filterConfig['roles'])) {
                    $conditions[] = "a.role IN ('" . implode("','", $filterConfig['roles']) . "')";
                }
                if (!empty($conditions)) {
                    $sql .= " WHERE " . implode(" AND ", $conditions);
                }
                break;

            case 'all_users':
            default:
                // No additional filtering
                break;
        }

        $sql .= " ORDER BY a.name LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);

        if ($scope['scope_type'] === 'ad_group' && isset($filterConfig['group_id'])) {
            $stmt->bindParam(':group_id', $filterConfig['group_id'], PDO::PARAM_INT);
        } elseif ($scope['scope_type'] === 'department' && isset($filterConfig['department'])) {
            $stmt->bindParam(':department', $filterConfig['department']);
        }

        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Update user count for extraction scope
     * @param int $scopeId Scope ID
     * @return int User count
     */
    private function updateScopeUserCount(int $scopeId): int
    {
        // Get all users for scope (without limit)
        $users = $this->getUsersForScope($scopeId, PHP_INT_MAX, 0);
        $count = count($users);

        $sql = "UPDATE extraction_scopes SET user_count = :count WHERE id = :scope_id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':count', $count, PDO::PARAM_INT);
        $stmt->bindParam(':scope_id', $scopeId, PDO::PARAM_INT);
        $stmt->execute();

        return $count;
    }

    /**
     * Toggle extraction scope status
     * @param int $scopeId Scope ID
     * @param bool $isActive New status
     * @return bool Success
     */
    public function toggleScopeStatus(int $scopeId, bool $isActive): bool
    {
        $sql = "UPDATE extraction_scopes SET is_active = :is_active WHERE id = :scope_id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':is_active', $isActive, PDO::PARAM_BOOL);
        $stmt->bindParam(':scope_id', $scopeId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }
}
