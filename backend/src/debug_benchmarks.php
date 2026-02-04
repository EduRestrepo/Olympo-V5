<?php
require __DIR__ . '/../vendor/autoload.php';

use Olympus\Db\Connection;
use Olympus\Services\BenchmarkingService;

try {
    $db = Connection::get();
    echo "=== BenchmarkingService ===\n";
    $svc = new BenchmarkingService($db);

    try {
        $benchmarks = $svc->getDepartmentBenchmarks();
        echo "Benchmarks: " . count($benchmarks) . " OK\n";
    } catch (\Throwable $e) { echo "Benchmarks ERROR: " . $e->getMessage() . "\n"; }

    // Check if getRankings exists
    if (method_exists($svc, 'getRankings')) {
        try {
            // Calculate first to ensure data exists
            $svc->calculateRankings();
            echo "calculateRankings: OK\n";

            $rankings = $svc->getRankings('top_collaborators');
            echo "Rankings (top_collaborators): " . count($rankings) . " OK\n";
        } catch (\Throwable $e) { echo "Rankings ERROR: " . $e->getMessage() . "\n"; }
    } else {
        echo "Rankings method missing!\n";
    }

} catch (\Throwable $e) {
    echo "FATAL: " . $e->getMessage() . "\n";
}
