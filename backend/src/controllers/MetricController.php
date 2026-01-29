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
            $stmt = $this->db->query("SELECT channel, total_count::INT FROM channel_totals");
            $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            foreach ($data as &$row) {
                $row['total_count'] = (int)$row['total_count'];
            }
            
            return new JsonResponse($data);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    public function getNetworkPulse(): JsonResponse
    {
        try {
            // Return last 10-30 days of activity
            $stmt = $this->db->query("SELECT date, activity_level::INT as value FROM network_pulse_daily ORDER BY date ASC LIMIT 30");
            $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            // Explicitly cast in PHP to be safe (redundant but robust)
            foreach ($data as &$row) {
                $row['value'] = (int)$row['value'];
            }
            
            return new JsonResponse($data);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    public function getToneIndex(): JsonResponse
    {
        try {
            $stmt = $this->db->query("SELECT date, score::FLOAT as value FROM tone_index_daily ORDER BY date ASC LIMIT 30");
            $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            foreach ($data as &$row) {
                $row['value'] = (float)$row['value'];
            }

            return new JsonResponse($data);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }
}
