<?php
require __DIR__ . '/../vendor/autoload.php';

use Olympus\Db\Connection;
use Olympus\Services\TemporalAnalysisService;
use Olympus\Services\CommunityDetectionService;
use Olympus\Services\PredictiveAnalyticsService;
use Olympus\Services\BenchmarkingService;

try {
    $db = Connection::get();
    
    echo "=== CommunityDetectionService ===\n";
    $community = new CommunityDetectionService($db);
    try {
        $silos = $community->getSilos();
        echo "Silos: " . count($silos) . " OK\n";
    } catch (\Throwable $e) { echo "Silos ERROR: " . $e->getMessage() . "\n"; }

    try {
        $bridges = $community->getBridges();
        echo "Bridges: " . count($bridges) . " OK\n";
    } catch (\Throwable $e) { echo "Bridges ERROR: " . $e->getMessage() . "\n"; }
    
    try {
        $diversity = $community->getNetworkDiversity();
        echo "Diversity: " . json_encode($diversity) . " OK\n";
    } catch (\Throwable $e) { echo "Diversity ERROR: " . $e->getMessage() . "\n"; }


} catch (\Throwable $e) {
    echo "FATAL: " . $e->getMessage() . "\n";
}
