<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Olympus\Db\Connection;

try {
    $db = Connection::get();
    
    echo "--- SEEDING TEAMS MEETING DATA ---\n";
    
    // Get all actors
    $stmt = $db->query("SELECT id, name, department FROM actors WHERE department IS NOT NULL");
    $actors = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($actors)) {
        die("No actors found to assign meetings to.\n");
    }
    
    $inserted = 0;
    
    $db->beginTransaction();
    
    // Clear existing records to avoid duplicates if re-run (optional, but cleaner for testing)
    // $db->exec("DELETE FROM teams_call_records"); 

    foreach ($actors as $actor) {
        // Generate 5-15 meetings per user in the last 30 days
        $numMeetings = rand(5, 15);
        
        for ($i = 0; $i < $numMeetings; $i++) {
            $daysAgo = rand(0, 30);
            $durationSeconds = rand(900, 5400); // 15 min to 1.5 hours
            $isOrganizer = (rand(0, 10) > 7) ? 'true' : 'false'; // 30% chance of being organizer
            
            $sql = "INSERT INTO teams_call_records (
                user_id, call_type, duration_seconds, is_organizer, call_timestamp
            ) VALUES (
                :user_id, 'group', :duration, :is_organizer, NOW() - INTERVAL '$daysAgo days'
            )";
            
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':user_id' => $actor['id'],
                ':duration' => $durationSeconds,
                ':is_organizer' => $isOrganizer
            ]);
            
            $inserted++;
        }
    }
    
    $db->commit();
    echo "Successfully inserted $inserted meeting records.\n";
    
    // Trigger Recalculation of Benchmarks
    echo "--- RECALCULATING BENCHMARKS ---\n";
    $service = new \Olympus\Services\BenchmarkingService($db);
    $count = $service->calculateDepartmentBenchmarks();
    echo "Updated benchmarks for $count departments.\n";

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo "Error: " . $e->getMessage() . "\n";
}
