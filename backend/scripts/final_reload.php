<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Olympus\Db\Connection;

try {
    $db = Connection::get();
    
    echo "--- FINAL RESET FOR FULL DATA IMPORT ---\n";
    
    // We only need to clear interactions and call records to prevent duplicates
    // since the ingestion process re-reads everything.
    $db->query("TRUNCATE TABLE interactions RESTART IDENTITY CASCADE");
    $db->query("TRUNCATE TABLE teams_call_records RESTART IDENTITY CASCADE");
    $db->query("UPDATE actors SET escalation_score = 0");
    
    echo "✓ Data cleared.\n";
    echo "--- STARTING FULL INGESTION (With Pagination) ---\n";
    
    $service = new \Olympus\Services\GraphIngestionService();
    $service->ingestAll();
    
    echo "\n--- INGESTION COMPLETE ---\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
