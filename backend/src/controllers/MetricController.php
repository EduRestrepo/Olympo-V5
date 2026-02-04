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



    public function getNetworkPulse(): JsonResponse
    {
        try {
            // Return last 30 days of activity (Latest first, then sort)
            $sql = "SELECT date, value FROM (
                        SELECT date, activity_level::INT as value 
                        FROM network_pulse_daily 
                        ORDER BY date DESC 
                        LIMIT 30
                    ) sub ORDER BY date ASC";
            
            $stmt = $this->db->query($sql);
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
            $sql = "SELECT date, value FROM (
                        SELECT date, score::FLOAT as value 
                        FROM tone_index_daily 
                        ORDER BY date DESC 
                        LIMIT 30
                    ) sub ORDER BY date ASC";
            
            $stmt = $this->db->query($sql);
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
