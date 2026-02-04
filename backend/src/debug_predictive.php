<?php
require __DIR__ . '/../vendor/autoload.php';

use Olympus\Db\Connection;
use Olympus\Services\PredictiveAnalyticsService;

try {
    $db = Connection::get();
    echo "=== PredictiveAnalyticsService ===\n";
    $svc = new PredictiveAnalyticsService($db);

    // Test getChurnRisk
    try {
        $churn = $svc->getChurnRisk();
        echo "ChurnRisk: " . count($churn) . " OK\n";
    } catch (\Throwable $e) { echo "ChurnRisk ERROR: " . $e->getMessage() . "\n"; }

    // Test getBurnoutIndicators
    try {
        $burnout = $svc->getBurnoutIndicators();
        echo "BurnoutIndicators: " . count($burnout) . " OK\n";
    } catch (\Throwable $e) { echo "BurnoutIndicators ERROR: " . $e->getMessage() . "\n"; }

    // Test getIsolationAlerts
    try {
        $isolation = $svc->getIsolationAlerts();
        echo "IsolationAlerts: " . count($isolation) . " OK\n";
    } catch (\Throwable $e) { echo "IsolationAlerts ERROR: " . $e->getMessage() . "\n"; }

    // Test Calculations
    try {
        $count = $svc->calculateChurnRisk();
        echo "calculateChurnRisk: $count calculated\n";
    } catch (\Throwable $e) { echo "calculateChurnRisk ERROR: " . $e->getMessage() . "\n"; }

    try {
        $count = $svc->calculateBurnoutIndicators();
        echo "calculateBurnoutIndicators: $count calculated\n";
    } catch (\Throwable $e) { echo "calculateBurnoutIndicators ERROR: " . $e->getMessage() . "\n"; }

    try {
        $count = $svc->calculateIsolationAlerts();
        echo "calculateIsolationAlerts: $count calculated\n";
    } catch (\Throwable $e) { echo "calculateIsolationAlerts ERROR: " . $e->getMessage() . "\n"; }


} catch (\Throwable $e) {
    echo "FATAL: " . $e->getMessage() . "\n";
}
