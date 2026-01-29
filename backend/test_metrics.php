<?php
require_once __DIR__ . '/src/Db/Connection.php';
require_once __DIR__ . '/src/Services/MetricService.php';

use Olympus\Services\MetricService;

echo "Calculating aggregates...\n";
$service = new MetricService();
$service->calculateAggregates();
echo "Done.\n";
