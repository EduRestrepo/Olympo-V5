<?php
require dirname(__DIR__) . '/vendor/autoload.php';

use Symfony\Component\Dotenv\Dotenv;
use Olympus\Db\Connection;
use Olympus\Services\MeetingAnalysisService;

// Load .env
$dotenv = new Dotenv();
$dotenv->load(dirname(__DIR__) . '/.env');

echo "--- RECALCULATING MEETING METRICS ---\n";

try {
    $pdo = Connection::get();
    $service = new MeetingAnalysisService($pdo);
    
    echo "Calculating Efficiency Scores...\n";
    $count = $service->calculateMeetingEfficiency();
    echo "Analyzed $count meetings.\n";
    
    echo "Calculating Attendance Patterns...\n";
    $count = $service->calculateAttendancePatterns();
    echo "Updated patterns for $count actors.\n";
    
    echo "Generating Recommendations...\n";
    $count = $service->generateRecommendations();
    echo "Generated $count recommendations.\n";
    
    echo "\nDone.\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
