<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Olympus\Db\Connection;

try {
    echo "Starting analytics database fixes...\n";
    
    $db = Connection::get();
    
    // 1. Fix Churn Columns
    $fixColumnsFile = __DIR__ . '/../src/Db/fix_churn_columns.sql';
    if (file_exists($fixColumnsFile)) {
        echo "Applying fix_churn_columns.sql...\n";
        $sql = file_get_contents($fixColumnsFile);
        $db->exec($sql);
        echo "✓ Columns fixed.\n";
    } else {
        echo "⚠ Warning: fix_churn_columns.sql not found at $fixColumnsFile\n";
    }
    
    // 2. Fix Churn Constraints
    $fixConstraintFile = __DIR__ . '/../src/Db/fix_churn_constraint_final.sql';
    if (file_exists($fixConstraintFile)) {
        echo "Applying fix_churn_constraint_final.sql...\n";
        $sql = file_get_contents($fixConstraintFile);
        
        // Handle potential "relation already exists" errors gracefully if the SQL script doesn't
        try {
            $db->exec($sql);
            echo "✓ Constraints fixed.\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'already exists') !== false) {
                 echo "ℹ Constraint already exists (skipped).\n";
            } else {
                throw $e;
            }
        }
    } else {
        echo "⚠ Warning: fix_churn_constraint_final.sql not found at $fixConstraintFile\n";
    }
    
    echo "\nAll fixes applied successfully!\n";
    
} catch (Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
