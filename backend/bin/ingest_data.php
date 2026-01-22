<?php

require dirname(__DIR__) . '/vendor/autoload.php';

use Symfony\Component\Dotenv\Dotenv;
use Olympus\Services\GraphIngestionService;

// Load .env
$dotenv = new Dotenv();
$dotenv->load(dirname(__DIR__) . '/.env');

echo "==========================================\n";
echo "Olympus - Metadata Ingestion Tool\n";
echo "==========================================\n";

$service = new GraphIngestionService();
$service->ingestAll();

echo "\nDone.\n";
