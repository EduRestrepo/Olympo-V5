<?php
require __DIR__ . '/../vendor/autoload.php';
use Olympus\Services\MetricService;

echo "Starting recalculation...\n";
$s = new MetricService();
$s->calculateAggregates();
echo "Recalculation complete.\n";
