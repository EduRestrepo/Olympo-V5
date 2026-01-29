<?php

namespace Olympus\Controllers;

use Symfony\Component\HttpFoundation\JsonResponse;

class SystemController
{
    public function getAbout(): JsonResponse
    {
        return new JsonResponse([
            'project' => 'Olympus Analytics',
            'version' => 'v5.0 Stable (Milestone)',
            'developer' => 'Eduardo Restrepo',
            'description' => 'Organizational Network Analysis based on Microsoft 365 Metadata.'
        ]);
    }
}
