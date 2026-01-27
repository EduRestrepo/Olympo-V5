<?php
require_once __DIR__ . '/vendor/autoload.php';

try {
    $pdo = new PDO('pgsql:host=db;port=5432;dbname=olympus_db', 'olympus', 'olympus_secret');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $seedFile = __DIR__ . '/src/db/seed.sql';
    if (!file_exists($seedFile)) {
        die("Seed file NOT FOUND at $seedFile\n");
    }
    
    $sql = file_get_contents($seedFile);
    echo "Seed file found (" . strlen($sql) . " bytes). Executing...\n";
    
    $pdo->exec($sql);
    echo "SUCCESS: Seed data imported.\n";
    
} catch(PDOException $e) {
    echo "SQL ERROR: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
} catch(Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
