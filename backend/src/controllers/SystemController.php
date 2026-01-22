<?php

namespace Olympus\Controllers;

use Symfony\Component\HttpFoundation\JsonResponse;

class SystemController
{
    public function getAbout(): JsonResponse
    {
        return new JsonResponse([
            'project' => 'Olympus Organizational Analytics',
            'version' => 'v4.0.0',
            'developer' => 'Eduardo Restrepo',
            'description' => 'A robust, enterprise-grade organizational intelligence platform based on Office365 metadata.'
        ]);
    }
}
