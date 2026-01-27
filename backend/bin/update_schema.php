<?php
require dirname(__DIR__) . '/vendor/autoload.php';

use Olympus\Db\Connection;

$pdo = Connection::get();

echo "Checking database schema...\n";

// Helper to check if column exists
function columnExists($pdo, $table, $column) {
    $stmt = $pdo->prepare("SELECT 1 FROM information_schema.columns WHERE table_name = ? AND column_name = ?");
    $stmt->execute([$table, $column]);
    return (bool) $stmt->fetch();
}

// 1. Update actors table
$columnsToAdd = [
    'department' => 'VARCHAR(255)',
    'country' => 'VARCHAR(100)',
    'escalation_score' => 'INT DEFAULT 0'
];

foreach ($columnsToAdd as $col => $def) {
    if (!columnExists($pdo, 'actors', $col)) {
        echo "Adding column '$col' to 'actors'...\n";
        $pdo->exec("ALTER TABLE actors ADD COLUMN $col $def");
    } else {
        echo "Column '$col' already exists in 'actors'.\n";
    }
}

echo "Schema update completed.\n";
