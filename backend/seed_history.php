<?php

require_once __DIR__ . '/vendor/autoload.php';

use Olympus\Db\Connection;

$db = Connection::get();

echo "Seeding historical data for charts (Last 14 days)...\n";

$today = new DateTime();
$pulseBase = 1200;
$toneBase = 65;

for ($i = 14; $i >= 1; $i--) {
    $date = (clone $today)->modify("-$i days")->format('Y-m-d');
    
    // Randomize slightly to look natural
    $pulse = $pulseBase + rand(-200, 300);
    $tone = $toneBase + rand(-10, 15);

    // Limit Tone 0-100
    if ($tone > 100) $tone = 98;
    if ($tone < 0) $tone = 5;

    // Check if exists
    $stmt = $db->prepare("SELECT COUNT(*) FROM network_pulse_daily WHERE date = :date");
    $stmt->execute(['date' => $date]);
    if ($stmt->fetchColumn() == 0) {
        $stmt = $db->prepare("INSERT INTO network_pulse_daily (date, activity_level) VALUES (:date, :value)");
        $stmt->execute(['date' => $date, 'value' => $pulse]);
        echo "  - Pulse seeded for $date: $pulse\n";
    }

    $stmt = $db->prepare("SELECT COUNT(*) FROM tone_index_daily WHERE date = :date");
    $stmt->execute(['date' => $date]);
    if ($stmt->fetchColumn() == 0) {
        $stmt = $db->prepare("INSERT INTO tone_index_daily (date, score) VALUES (:date, :score)");
        $stmt->execute(['date' => $date, 'score' => $tone]);
        echo "  - Tone seeded for $date: $tone\n";
    }
}

echo "Seeding completed.\n";
