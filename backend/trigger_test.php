<?php
require_once __DIR__ . '/vendor/autoload.php';

use Olympus\Services\MetricService;

echo "Triggering Calculation..." . PHP_EOL;
try {
    $service = new MetricService();
    $service->calculateActivityHeatmap();
    echo "Done!" . PHP_EOL;
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . PHP_EOL;
    echo $e->getTraceAsString() . PHP_EOL;
}
