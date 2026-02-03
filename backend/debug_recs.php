<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/src/Config/Database.php';

use Olympus\Config\Database;

try {
    $db = Database::getConnection();
    
    echo "--- Meeting Efficiency Scores (Sample) ---\n";
    $stmt = $db->query("SELECT duration_minutes, participant_count, cost_hours, efficiency_score FROM meeting_efficiency_scores LIMIT 5");
    $scores = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($scores);

    echo "\n--- Meeting Recommendations (All) ---\n";
    $stmt = $db->query("SELECT recommendation_type, potential_savings_hours FROM meeting_recommendations");
    $recs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $count = count($recs);
    echo "Total Recommendations: $count\n";
    
    $sums = [];
    foreach ($recs as $r) {
        $type = $r['recommendation_type'];
        if (!isset($sums[$type])) $sums[$type] = 0;
        $sums[$type] += floatval($r['potential_savings_hours']);
    }
    print_r($sums);
    
    if ($count > 0) {
        echo "\nSample Recommendations:\n";
        print_r(array_slice($recs, 0, 10));
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
