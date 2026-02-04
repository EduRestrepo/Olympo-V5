<?php

use Symfony\Component\Routing\RouteCollection;
use Symfony\Component\Routing\Route;

$routes = new RouteCollection();

$routes->add('top_influencers', (new Route('/api/top-influencers', [
    '_controller' => ['Olympus\Controllers\InfluencerController', 'getTopInfluencers']
])));

$routes->add('balance_power', (new Route('/api/balance-power', [
    '_controller' => ['Olympus\Controllers\InfluencerController', 'getBalancePower']
])));

$routes->add('influence_graph', (new Route('/api/influence-graph', [
    '_controller' => ['Olympus\Controllers\InfluencerController', 'getInfluenceGraph']
])));



$routes->add('network_pulse', (new Route('/api/network-pulse', [
    '_controller' => ['Olympus\Controllers\MetricController', 'getNetworkPulse']
])));

$routes->add('tone_index', (new Route('/api/tone-index', [
    '_controller' => ['Olympus\Controllers\MetricController', 'getToneIndex']
])));

$routes->add('about', (new Route('/api/about', [
    '_controller' => ['Olympus\Controllers\SystemController', 'getAbout']
])));

$routes->add('get_settings', (new Route('/api/settings', [
    '_controller' => ['Olympus\Controllers\SettingsController', 'getSettings']
]))->setMethods(['GET']));

$routes->add('save_settings', (new Route('/api/settings', [
    '_controller' => ['Olympus\Controllers\SettingsController', 'saveSettings']
]))->setMethods(['POST']));

$routes->add('test_connection', (new Route('/api/settings/test-connection', [
    '_controller' => ['Olympus\Controllers\SettingsController', 'testConnection']
]))->setMethods(['POST']));

$routes->add('trigger_extraction', (new Route('/api/settings/extract-data', [
    '_controller' => ['Olympus\Controllers\SettingsController', 'triggerExtraction']
]))->setMethods(['POST']));

$routes->add('wipe_database', (new Route('/api/settings/wipe-database', [
    '_controller' => ['Olympus\Controllers\SettingsController', 'wipeDatabase']
]))->setMethods(['POST']));

$routes->add('seed_database', (new Route('/api/settings/seed-database', [
    '_controller' => ['Olympus\Controllers\SettingsController', 'seedDatabase']
]))->setMethods(['POST']));

$routes->add('get_logs', (new Route('/api/settings/logs', [
    '_controller' => ['Olympus\Controllers\SettingsController', 'getLogs']
]))->setMethods(['GET']));

// ============================================================================
// ADVANCED ANALYTICS ROUTES (V5.1)
// ============================================================================

// Temporal Analysis


$routes->add('overloaded_users', (new Route('/api/analytics/temporal/overload', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'getOverloadedUsers']
]))->setMethods(['GET']));

$routes->add('response_time_analysis', (new Route('/api/analytics/temporal/response-time', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'getResponseTimeAnalysis']
]))->setMethods(['GET']));

$routes->add('timezone_collaboration', (new Route('/api/analytics/temporal/timezone', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'getTimezoneCollaboration']
]))->setMethods(['GET']));

$routes->add('calculate_temporal', (new Route('/api/analytics/temporal/calculate', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'calculateTemporalMetrics']
]))->setMethods(['POST']));

// Community Detection
$routes->add('detect_communities', (new Route('/api/analytics/communities/detect', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'detectCommunities']
]))->setMethods(['POST']));

$routes->add('get_communities', (new Route('/api/analytics/communities', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'getCommunities']
]))->setMethods(['GET']));

$routes->add('get_silos', (new Route('/api/analytics/communities/silos', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'getSilos']
]))->setMethods(['GET']));

$routes->add('detect_silos', (new Route('/api/analytics/communities/silos/detect', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'detectSilos']
]))->setMethods(['POST']));

$routes->add('get_bridges', (new Route('/api/analytics/communities/bridges', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'getBridges']
]))->setMethods(['GET']));

$routes->add('detect_bridges', (new Route('/api/analytics/communities/bridges/detect', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'detectBridges']
]))->setMethods(['POST']));

$routes->add('network_diversity', (new Route('/api/analytics/communities/diversity', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'getNetworkDiversity']
]))->setMethods(['GET']));

$routes->add('calculate_community_metrics', (new Route('/api/analytics/communities/calculate', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'calculateCommunityMetrics']
]))->setMethods(['POST']));

// Meeting Analysis
$routes->add('meeting_efficiency', (new Route('/api/analytics/meetings/efficiency', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'getMeetingEfficiency']
]))->setMethods(['GET']));

$routes->add('meeting_costs', (new Route('/api/analytics/meetings/costs', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'getMeetingCosts']
]))->setMethods(['GET']));

$routes->add('meeting_recommendations', (new Route('/api/analytics/meetings/recommendations', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'getMeetingRecommendations']
]))->setMethods(['GET']));

$routes->add('calculate_meeting_metrics', (new Route('/api/analytics/meetings/calculate', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'calculateMeetingMetrics']
]))->setMethods(['POST']));

// Predictive Analytics
$routes->add('churn_risk', (new Route('/api/analytics/predictions/churn', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'getChurnRisk']
]))->setMethods(['GET']));

$routes->add('burnout_indicators', (new Route('/api/analytics/predictions/burnout', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'getBurnoutIndicators']
]))->setMethods(['GET']));

$routes->add('isolation_alerts', (new Route('/api/analytics/predictions/isolation', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'getIsolationAlerts']
]))->setMethods(['GET']));

$routes->add('calculate_predictions', (new Route('/api/analytics/predictions/calculate', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'calculatePredictiveMetrics']
]))->setMethods(['POST']));

// Benchmarking
$routes->add('department_benchmarks', (new Route('/api/analytics/benchmarks/departments', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'getDepartmentBenchmarks']
]))->setMethods(['GET']));

$routes->add('rankings', (new Route('/api/analytics/benchmarks/rankings', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'getRankings']
]))->setMethods(['GET']));

$routes->add('calculate_benchmarks', (new Route('/api/analytics/benchmarks/calculate', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'calculateBenchmarks']
]))->setMethods(['POST']));

// Export
$routes->add('export_data', (new Route('/api/analytics/export', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'exportData']
]))->setMethods(['GET']));

// Gamification
$routes->add('user_badges', (new Route('/api/analytics/gamification/badges/{actor_id}', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'getUserBadges']
]))->setMethods(['GET']));

$routes->add('connection_suggestions', (new Route('/api/analytics/gamification/suggestions/{actor_id}', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'getConnectionSuggestions']
]))->setMethods(['GET']));

$routes->add('user_goals', (new Route('/api/analytics/gamification/goals/{actor_id}', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'getUserGoals']
]))->setMethods(['GET']));

// Batch Processing & AD Groups
$routes->add('batch_jobs', (new Route('/api/analytics/batch/jobs', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'getBatchJobs']
]))->setMethods(['GET']));

$routes->add('ad_groups', (new Route('/api/analytics/ad-groups', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'getADGroups']
]))->setMethods(['GET']));

$routes->add('extraction_scopes', (new Route('/api/analytics/extraction-scopes', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'getExtractionScopes']
]))->setMethods(['GET']));

$routes->add('create_extraction_scope', (new Route('/api/analytics/extraction-scopes', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'createExtractionScope']
]))->setMethods(['POST']));

// System Status
$routes->add('get_system_status', (new Route('/api/system/status', [
    '_controller' => ['Olympus\\Controllers\\AnalyticsController', 'getSystemStatus']
]))->setMethods(['GET']));

return $routes;
