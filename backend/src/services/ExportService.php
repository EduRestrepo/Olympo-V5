<?php

namespace App\Services;

use PDO;

class ExportService
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Export data to CSV
     * @param string $exportType Type of export
     * @param array $filters Optional filters
     * @return array CSV data and metadata
     */
    public function exportToCSV(string $exportType, array $filters = []): array
    {
        $data = $this->getData($exportType, $filters);
        
        // Convert to CSV format
        $csv = $this->arrayToCSV($data);
        
        // Log export
        $this->logExport('csv', $exportType, count($data), strlen($csv) / 1024, $filters);
        
        return [
            'data' => $csv,
            'filename' => $exportType . '_' . date('Y-m-d_His') . '.csv',
            'record_count' => count($data)
        ];
    }

    /**
     * Get data for export
     * @param string $exportType Type of data to export
     * @param array $filters Filters to apply
     * @return array Data rows
     */
    private function getData(string $exportType, array $filters): array
    {
        switch ($exportType) {
            case 'actors':
                return $this->getActorsData($filters);
            case 'interactions':
                return $this->getInteractionsData($filters);
            case 'influence_scores':
                return $this->getInfluenceScoresData($filters);
            case 'temporal_analysis':
                return $this->getTemporalAnalysisData($filters);
            case 'communities':
                return $this->getCommunitiesData($filters);
            default:
                throw new \Exception("Unknown export type: $exportType");
        }
    }

    private function getActorsData(array $filters): array
    {
        $sql = "SELECT 
                    a.id, a.name, a.email, a.role, a.badge, a.department, a.country,
                    rt.avg_response_seconds / 3600.0 as avg_response_hours,
                    (SELECT COUNT(*) FROM influence_links WHERE source_id = a.id) as network_size
                FROM actors a
                LEFT JOIN response_times rt ON a.id = rt.actor_id
                ORDER BY a.name";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function getInteractionsData(array $filters): array
    {
        $sql = "SELECT 
                    i.id, 
                    a1.name as source_name, a1.email as source_email,
                    a2.name as target_name, a2.email as target_email,
                    i.channel, i.volume, i.interaction_date
                FROM interactions i
                JOIN actors a1 ON i.source_id = a1.id
                JOIN actors a2 ON i.target_id = a2.id
                WHERE i.interaction_date >= CURRENT_DATE - INTERVAL '30 days'
                ORDER BY i.interaction_date DESC";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function getInfluenceScoresData(array $filters): array
    {
        $sql = "SELECT 
                    a.name, a.email, a.department, a.badge,
                    SUM(CASE WHEN il.source_id = a.id THEN il.weight ELSE 0 END) as outgoing_influence,
                    SUM(CASE WHEN il.target_id = a.id THEN il.weight ELSE 0 END) as incoming_influence
                FROM actors a
                LEFT JOIN influence_links il ON a.id = il.source_id OR a.id = il.target_id
                GROUP BY a.id
                ORDER BY outgoing_influence DESC";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function getTemporalAnalysisData(array $filters): array
    {
        $sql = "SELECT 
                    a.name, a.email, a.department,
                    om.week_start_date,
                    om.total_meetings, om.total_meeting_hours,
                    om.emails_sent, om.emails_received,
                    om.overload_score, om.risk_level
                FROM overload_metrics om
                JOIN actors a ON om.actor_id = a.id
                WHERE om.week_start_date >= CURRENT_DATE - INTERVAL '8 weeks'
                ORDER BY om.week_start_date DESC, om.overload_score DESC";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function getCommunitiesData(array $filters): array
    {
        $sql = "SELECT 
                    c.name as community_name,
                    a.name as member_name, a.email, a.department,
                    cm.membership_strength, cm.is_core_member
                FROM communities c
                JOIN community_members cm ON c.id = cm.community_id
                JOIN actors a ON cm.actor_id = a.id
                WHERE c.detection_date = (SELECT MAX(detection_date) FROM communities)
                ORDER BY c.name, a.name";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Convert array to CSV string
     * @param array $data Data rows
     * @return string CSV content
     */
    private function arrayToCSV(array $data): string
    {
        if (empty($data)) {
            return '';
        }

        $output = fopen('php://temp', 'r+');
        
        // Write headers
        fputcsv($output, array_keys($data[0]));
        
        // Write data
        foreach ($data as $row) {
            fputcsv($output, $row);
        }
        
        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);
        
        return $csv;
    }

    /**
     * Log export activity
     * @param string $exportType Export format
     * @param string $dataType Type of data exported
     * @param int $recordCount Number of records
     * @param int $fileSizeKb File size in KB
     * @param array $filters Filters applied
     */
    private function logExport(string $exportType, string $dataType, int $recordCount, int $fileSizeKb, array $filters): void
    {
        $sql = "INSERT INTO export_history (export_type, exported_by, record_count, file_size_kb, filters_applied)
                VALUES (:export_type, :exported_by, :record_count, :file_size_kb, :filters)";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':export_type', $exportType);
        $exportedBy = $dataType; // Could be username in real implementation
        $stmt->bindParam(':exported_by', $exportedBy);
        $stmt->bindParam(':record_count', $recordCount, PDO::PARAM_INT);
        $stmt->bindParam(':file_size_kb', $fileSizeKb, PDO::PARAM_INT);
        $filtersJson = json_encode($filters);
        $stmt->bindParam(':filters', $filtersJson);
        $stmt->execute();
    }

    /**
     * Get export history
     * @param int $limit Number of records
     * @return array Export history
     */
    public function getExportHistory(int $limit = 50): array
    {
        $sql = "SELECT * FROM export_history ORDER BY export_timestamp DESC LIMIT :limit";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
