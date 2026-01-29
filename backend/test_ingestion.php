<?php
require_once __DIR__ . '/vendor/autoload.php';

use Olympus\Services\GraphIngestionService;
use Symfony\Component\Dotenv\Dotenv;

// Load .env
$dotenv = new Dotenv();
if (file_exists(__DIR__ . '/.env')) {
    $dotenv->load(__DIR__ . '/.env');
}

echo "Starting Ingestion Test...\n";

try {
    $service = new GraphIngestionService();
    echo "Service instantiated.\n";
    
    $service->ingestAll();
    echo "Ingestion completed successfully.\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
