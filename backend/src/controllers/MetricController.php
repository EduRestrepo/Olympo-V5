<?php

namespace Olympus\Controllers;

use Olympus\Db\Connection;
use Symfony\Component\HttpFoundation\JsonResponse;

class MetricController
{
    private $db;

    public function __construct()
    {
        $this->db = Connection::get();
    }

    public function getChannelTotals(): JsonResponse
    {
        try {
            $stmt = $this->db->query("SELECT channel, total_count FROM channel_totals");
            $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            return new JsonResponse($data);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    public function getNetworkPulse(): JsonResponse
    {
        try {
            // Return last 10-30 days of activity
            $stmt = $this->db->query("SELECT date, activity_level as value FROM network_pulse_daily ORDER BY date ASC LIMIT 30");
            $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            return new JsonResponse($data);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    public function getToneIndex(): JsonResponse
    {
        try {
            $stmt = $this->db->query("SELECT date, score as value FROM tone_index_daily ORDER BY date ASC LIMIT 30");
            $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            return new JsonResponse($data);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }
}
