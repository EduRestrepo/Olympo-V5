<?php
require_once __DIR__ . '/vendor/autoload.php';

try {
    echo "Starting Reset...\n";
    $repo = new \Olympus\Db\SettingRepository();
    // Force reset with seed
    $repo->resetData(true); 
    echo "Reset Complete. Seed data reloaded.\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
