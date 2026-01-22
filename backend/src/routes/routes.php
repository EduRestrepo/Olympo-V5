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

return $routes;
