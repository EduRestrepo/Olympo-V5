<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Olympus\Db\Connection;

try {
    $db = Connection::get();
    
    echo "--- RESETTING ANALYTICS DATA ---\n";
    
    // Truncate Tables to start fresh
    // 1. Teams Call Records (No unique constraint, must clear to avoid dupes)
    $db->query("TRUNCATE TABLE teams_call_records RESTART IDENTITY CASCADE");
    echo "✓ Truncated teams_call_records\n";

    // 2. Interactions (Influence graph) - Optional but good for "clean load"
    $db->query("TRUNCATE TABLE interactions RESTART IDENTITY CASCADE");
    echo "✓ Truncated interactions\n";
    
    // 3. Reset Actor Escalation Scores (since we re-process emails)
    $db->query("UPDATE actors SET escalation_score = 0");
    echo "✓ Reset actor escalation scores\n";

    echo "\nReady for fresh ingestion.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
