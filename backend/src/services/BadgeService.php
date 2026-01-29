<?php

namespace Olympus\Services;

use Olympus\Db\Connection;

class BadgeService
{
    private $db;

    public function __construct()
    {
        $this->db = Connection::get();
    }

    /**
     * Assign badges based on rank in the provided list.
     * @param array $rankedActors List of actors sorted by score descending. MUST contain 'id' and 'rank'.
     */
    public function assignBadges(array $rankedActors): void
    {
        if (empty($rankedActors)) return;

        foreach ($rankedActors as $actor) {
            $id = $actor['id'];
            $rank = $actor['rank'];
            
            $badge = $this->determineBadge($rank, count($rankedActors));
            
            // Only update if different to avoid DB thrashing?
            // For now, simple update is fine.
            $this->updateBadge($id, $badge);
        }
    }

    private function determineBadge(int $rank, int $totalUsers): string
    {
        if ($rank === 1) return '♚'; // King
        if ($rank <= 3) return '♛'; // Queen
        if ($rank <= 10) return '♜'; // Rook
        
        // Percentile based for the rest
        $percentile = ($rank / $totalUsers) * 100;
        
        if ($percentile <= 15) return '♗'; // Bishop (Top 15%)
        if ($percentile <= 30) return '♞'; // Knight (Top 30%)
        
        return '♙'; // Pawn
    }

    private function updateBadge(int $actorId, string $badge): void
    {
        $stmt = $this->db->prepare("UPDATE actors SET badge = :badge WHERE id = :id");
        $stmt->execute(['badge' => $badge, 'id' => $actorId]);
    }
}
