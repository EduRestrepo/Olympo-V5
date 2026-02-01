<?php

namespace Olympus\Services;

use PDO;

/**
 * Batch Processing Service for Large-Scale Data Extraction
 * Handles 5,000+ users with chunked processing and Active Directory group filtering
 */
class BatchProcessingService
{
    private PDO $db;
    private int $batchSize;
    private int $maxConcurrent;

    public function __construct(PDO $db, int $batchSize = 100, int $maxConcurrent = 5)
    {
        $this->db = $db;
        $this->batchSize = $batchSize;
        $this->maxConcurrent = $maxConcurrent;
    }

    /**
     * Create batch processing job
     * @param array $config Job configuration
     * @return int Job ID
     */
    public function createBatchJob(array $config): int
    {
        $sql = "INSERT INTO batch_jobs (
                    job_name, job_type, total_items, batch_size, 
                    status, config, created_at
                )
                VALUES (
                    :job_name, :job_type, :total_items, :batch_size,
                    'pending', :config, CURRENT_TIMESTAMP
                )
                RETURNING id";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':job_name', $config['job_name']);
        $stmt->bindParam(':job_type', $config['job_type']);
        $stmt->bindParam(':total_items', $config['total_items'], PDO::PARAM_INT);
        $stmt->bindParam(':batch_size', $this->batchSize, PDO::PARAM_INT);
        $configJson = json_encode($config);
        $stmt->bindParam(':config', $configJson);
        $stmt->execute();

        return $stmt->fetchColumn();
    }

    /**
     * Process batch job in chunks
     * @param int $jobId Job ID
     * @param callable $processor Processing function
     * @return array Processing results
     */
    public function processBatchJob(int $jobId, callable $processor): array
    {
        // Get job details
        $job = $this->getBatchJob($jobId);
        if (!$job) {
            throw new \Exception("Batch job not found: $jobId");
        }

        // Update status to running
        $this->updateJobStatus($jobId, 'running');

        $config = json_decode($job['config'], true);
        $totalItems = $job['total_items'];
        $processed = 0;
        $errors = [];
        $results = [];

        try {
            // Process in batches
            for ($offset = 0; $offset < $totalItems; $offset += $this->batchSize) {
                $batchConfig = array_merge($config, [
                    'offset' => $offset,
                    'limit' => $this->batchSize
                ]);

                // Process batch
                $batchResult = $processor($batchConfig);
                $results[] = $batchResult;

                // Update progress
                $processed += min($this->batchSize, $totalItems - $offset);
                $this->updateJobProgress($jobId, $processed, $totalItems);

                // Small delay to avoid rate limiting
                usleep(500000); // 0.5 seconds
            }

            // Mark as completed
            $this->updateJobStatus($jobId, 'completed', [
                'processed' => $processed,
                'errors' => $errors,
                'results' => $results
            ]);

        } catch (\Exception $e) {
            // Mark as failed
            $this->updateJobStatus($jobId, 'failed', [
                'error' => $e->getMessage(),
                'processed' => $processed
            ]);
            throw $e;
        }

        return [
            'job_id' => $jobId,
            'status' => 'completed',
            'processed' => $processed,
            'total' => $totalItems,
            'results' => $results
        ];
    }

    /**
     * Get batch job details
     * @param int $jobId Job ID
     * @return array|null Job details
     */
    public function getBatchJob(int $jobId): ?array
    {
        $sql = "SELECT * FROM batch_jobs WHERE id = :job_id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':job_id', $jobId, PDO::PARAM_INT);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Update job status
     * @param int $jobId Job ID
     * @param string $status New status
     * @param array|null $metadata Additional metadata
     */
    private function updateJobStatus(int $jobId, string $status, ?array $metadata = null): void
    {
        $sql = "UPDATE batch_jobs 
                SET status = :status, 
                    updated_at = CURRENT_TIMESTAMP";

        if ($metadata) {
            $sql .= ", metadata = :metadata";
        }

        if ($status === 'completed') {
            $sql .= ", completed_at = CURRENT_TIMESTAMP";
        }

        $sql .= " WHERE id = :job_id";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':job_id', $jobId, PDO::PARAM_INT);

        if ($metadata) {
            $metadataJson = json_encode($metadata);
            $stmt->bindParam(':metadata', $metadataJson);
        }

        $stmt->execute();
    }

    /**
     * Update job progress
     * @param int $jobId Job ID
     * @param int $processed Items processed
     * @param int $total Total items
     */
    private function updateJobProgress(int $jobId, int $processed, int $total): void
    {
        $progress = ($processed / $total) * 100;

        $sql = "UPDATE batch_jobs 
                SET items_processed = :processed,
                    progress_pct = :progress,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :job_id";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':processed', $processed, PDO::PARAM_INT);
        $stmt->bindParam(':progress', $progress);
        $stmt->bindParam(':job_id', $jobId, PDO::PARAM_INT);
        $stmt->execute();
    }

    /**
     * Get all batch jobs
     * @param string|null $status Filter by status
     * @return array Jobs list
     */
    public function getBatchJobs(?string $status = null): array
    {
        $sql = "SELECT * FROM batch_jobs";

        if ($status) {
            $sql .= " WHERE status = :status";
        }

        $sql .= " ORDER BY created_at DESC LIMIT 100";

        $stmt = $this->db->prepare($sql);
        if ($status) {
            $stmt->bindParam(':status', $status);
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Cancel batch job
     * @param int $jobId Job ID
     * @return bool Success
     */
    public function cancelBatchJob(int $jobId): bool
    {
        $sql = "UPDATE batch_jobs 
                SET status = 'cancelled', 
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :job_id AND status IN ('pending', 'running')";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':job_id', $jobId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }

    /**
     * Cleanup old completed jobs
     * @param int $daysOld Days to keep
     * @return int Number of jobs deleted
     */
    public function cleanupOldJobs(int $daysOld = 30): int
    {
        $sql = "DELETE FROM batch_jobs 
                WHERE status IN ('completed', 'failed', 'cancelled')
                    AND completed_at < CURRENT_DATE - INTERVAL ':days days'";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':days', $daysOld, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->rowCount();
    }
}
