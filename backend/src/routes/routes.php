<?php

use Symfony\Component\Routing\RouteCollection;
use Symfony\Component\Routing\Route;

$routes = new RouteCollection();

$routes->add('top_influencers', new Route('/api/top-influencers', [
    '_controller' => ['Olympus\Controllers\InfluencerController', 'getTopInfluencers']
]));

$routes->add('balance_power', new Route('/api/balance-power', [
    '_controller' => ['Olympus\Controllers\InfluencerController', 'getBalancePower']
]));

$routes->add('influence_graph', new Route('/api/influence-graph', [
    '_controller' => ['Olympus\Controllers\InfluencerController', 'getInfluenceGraph']
]));

$routes->add('channel_totals', new Route('/api/channel-totals', [
    '_controller' => ['Olympus\Controllers\MetricController', 'getChannelTotals']
]));

$routes->add('network_pulse', new Route('/api/network-pulse', [
    '_controller' => ['Olympus\Controllers\MetricController', 'getNetworkPulse']
]));

$routes->add('tone_index', new Route('/api/tone-index', [
    '_controller' => ['Olympus\Controllers\MetricController', 'getToneIndex']
]));

$routes->add('about', new Route('/api/about', [
    '_controller' => ['Olympus\Controllers\SystemController', 'getAbout']
]));

$routes->add('get_settings', new Route('/api/settings', [
    '_controller' => ['Olympus\Controllers\SettingsController', 'getSettings'],
    '_methods' => ['GET']
]));

$routes->add('save_settings', new Route('/api/settings', [
    '_controller' => ['Olympus\Controllers\SettingsController', 'saveSettings'],
    '_methods' => ['POST']
]));

$routes->add('test_connection', new Route('/api/settings/test-connection', [
    '_controller' => ['Olympus\Controllers\SettingsController', 'testConnection'],
    '_methods' => ['POST']
]));

$routes->add('trigger_extraction', new Route('/api/settings/extract-data', [
    '_controller' => ['Olympus\Controllers\SettingsController', 'triggerExtraction'],
    '_methods' => ['POST']
]));

$routes->add('wipe_database', new Route('/api/settings/wipe-database', [
    '_controller' => ['Olympus\Controllers\SettingsController', 'wipeDatabase'],
    '_methods' => ['POST']
]));

$routes->add('seed_database', new Route('/api/settings/seed-database', [
    '_controller' => ['Olympus\Controllers\SettingsController', 'seedDatabase'],
    '_methods' => ['POST']
]));

$routes->add('get_logs', new Route('/api/settings/logs', [
    '_controller' => ['Olympus\Controllers\SettingsController', 'getLogs'],
    '_methods' => ['GET']
]));

return $routes;
