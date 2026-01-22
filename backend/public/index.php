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

$request = Request::createFromGlobals();

// CORS Handling
if ($request->getMethod() === 'OPTIONS') {
    $response = new JsonResponse(null, 204);
    $response->headers->set('Access-Control-Allow-Origin', '*');
    $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    $response->send();
    exit;
}

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

    $instance = new $class();
    $response = $instance->$method($request);

} catch (ResourceNotFoundException $e) {
    $response = new JsonResponse(['error' => 'Not Found'], 404);
} catch (\Exception $e) {
    $response = new JsonResponse(['error' => 'Internal Server Error: ' . $e->getMessage()], 500);
}

// Add CORS headers to actual response
$response->headers->set('Access-Control-Allow-Origin', '*');
$response->send();
