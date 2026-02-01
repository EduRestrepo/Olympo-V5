<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\RequestContext;
use Symfony\Component\Routing\Matcher\UrlMatcher;
use Symfony\Component\Routing\Exception\ResourceNotFoundException;
use Symfony\Component\Dotenv\Dotenv;

// Load Env
$dotenv = new Dotenv();
if (file_exists(__DIR__ . '/../.env')) {
    $dotenv->load(__DIR__ . '/../.env');
}

// Initialize Request
$request = Request::createFromGlobals();

// CORS Handling - MUST BE FIRST
if ($request->getMethod() === 'OPTIONS') {
    $response = new JsonResponse(null, 204);
    $response->headers->set('Access-Control-Allow-Origin', '*');
    $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    $response->send();
    exit;
}

// Auto-Seed Logic for DEV environment (DISABLED FOR STABILITY)
/*
$env = $_ENV['APP_ENV'] ?? 'dev';
if ($env !== 'prod') {
    try {
        $repo = new \Olympus\Db\SettingRepository();
        // Check if actors table is empty
        $conn = \Olympus\Db\Connection::get();
        $stmt = $conn->query("SELECT count(*) as count FROM actors");
        $count = $stmt->fetch()['count'];

        if ($count == 0) {
            // Auto-seed
            $repo->resetData(true); 
        }
    } catch (\Exception $e) {
        // Silently fail or log
    }
}
*/

// Routing
$routes = require __DIR__ . '/../src/routes/routes.php';
$context = new RequestContext();
$context->fromRequest($request);

$matcher = new UrlMatcher($routes, $context);

try {
    $parameters = $matcher->match($request->getPathInfo());

    $controller = $parameters['_controller'];

    // Instantiate Controller and Call Method
    $class = $controller[0];
    $method = $controller[1];

    // Get database connection
    $db = \Olympus\Db\Connection::get();
    
    $instance = new $class($db);
    $response = $instance->$method($request);

} catch (ResourceNotFoundException $e) {
    $response = new JsonResponse(['error' => 'Not Found'], 404);
} catch (\Exception $e) {
    $response = new JsonResponse(['error' => 'Internal Server Error: ' . $e->getMessage()], 500);
}

// Add CORS headers to actual response
$response->headers->set('Access-Control-Allow-Origin', '*');
$response->send();
