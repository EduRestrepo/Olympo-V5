<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Olympus\Db\Connection;

try {
    $db = Connection::get();
    
    echo "--- ROLLING BACK TEAMS MEETING DATA ---\n";
    
    // The table was empty before, so TRUNCATE is safe and restores original state
    $stmt = $db->query("TRUNCATE TABLE teams_call_records CASCADE");
    echo "Table teams_call_records truncated.\n";
    
    // Trigger Recalculation of Benchmarks to reflect zero data
    echo "--- RECALCULATING BENCHMARKS (Should be 0) ---\n";
    $service = new \Olympus\Services\BenchmarkingService($db);
    $count = $service->calculateDepartmentBenchmarks();
    echo "Updated benchmarks for $count departments.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
