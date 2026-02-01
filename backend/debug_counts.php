<?php
require_once __DIR__ . '/vendor/autoload.php';

use Olympus\Db\Connection;

$db = Connection::get();

echo "--- Debugging Data ---" . PHP_EOL;

// 1. Check Interactions (Source for Emails)
$stmt = $db->query("SELECT COUNT(*) FROM interactions");
echo "Interactions Count: " . $stmt->fetchColumn() . PHP_EOL;

$stmt = $db->query("SELECT MIN(interaction_date), MAX(interaction_date) FROM interactions");
$dates = $stmt->fetch(PDO::FETCH_ASSOC);
echo "Interactions Date Range: " . $dates['min'] . " to " . $dates['max'] . PHP_EOL;

// 2. Check Teams Calls (Source for Meetings)
$stmt = $db->query("SELECT COUNT(*) FROM teams_call_records");
echo "Teams Calls Count: " . $stmt->fetchColumn() . PHP_EOL;

$stmt = $db->query("SELECT MIN(call_timestamp), MAX(call_timestamp) FROM teams_call_records");
$dates = $stmt->fetch(PDO::FETCH_ASSOC);
echo "Teams Calls Date Range: " . $dates['min'] . " to " . $dates['max'] . PHP_EOL;

// 3. Check Activity Heatmap (Target Table)
$stmt = $db->query("SELECT COUNT(*) FROM activity_heatmap");
echo "Activity Heatmap Count: " . $stmt->fetchColumn() . PHP_EOL;

$stmt = $db->query("SELECT MIN(activity_date), MAX(activity_date) FROM activity_heatmap");
$dates = $stmt->fetch(PDO::FETCH_ASSOC);
echo "Heatmap Date Range: " . $dates['min'] . " to " . $dates['max'] . PHP_EOL;

echo "----------------------" . PHP_EOL;
