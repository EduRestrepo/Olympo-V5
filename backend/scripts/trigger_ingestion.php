<?php
require_once __DIR__ . '/../vendor/autoload.php';

try {
    echo "--- STARTING REAL TEAMS DATA INGESTION ---\n";
    
    // Instantiate and run the ingestion service
    $service = new \Olympus\Services\GraphIngestionService();
    
    // We only want to run the Teams part? The service logic runs ALL (Email + Teams).
    // But since it's "ingestAll", we should probably run it to be safe and ensure consistency.
    // However, to save time/limits, maybe we can just call the public method.
    
    $service->ingestAll();
    
    echo "\n--- INGESTION COMPLETED ---\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
