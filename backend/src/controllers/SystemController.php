<?php

namespace Olympus\Controllers;

use Symfony\Component\HttpFoundation\JsonResponse;

class SystemController
{
    public function getAbout(): JsonResponse
    {
            'project' => 'Olympus Analytics',
            'version' => 'v5.1 Stable (Advanced Analytics)',
            'description' => 'Plataforma de analítica organizacional basada en metadatos de Microsoft 365. Revela patrones de influencia y dinámicas de equipo sin acceder al contenido.',
            'author' => 'Eduardo Restrepo',
            'emails' => ['eduardo.restrepo@gmail.com', 'eduardo.restrepo@protonmail.ch']
        ]);
    }
}
