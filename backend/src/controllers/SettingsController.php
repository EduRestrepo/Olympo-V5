<?php

namespace Olympus\Controllers;

use Olympus\Db\SettingRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class SettingsController
{
    private SettingRepository $repository;

    public function __construct()
    {
        $this->repository = new SettingRepository();
    }

    public function getSettings(Request $request): JsonResponse
    {
        $settings = $this->repository->getAll();
        
        $flat = [];
        foreach ($settings as $s) {
            $flat[$s['key']] = $s['value'];
        }

        return new JsonResponse($flat);
    }

    public function saveSettings(Request $request): JsonResponse
    {
        $json = $request->getContent();
        $data = json_decode($json, true);

        if (!$data) {
            return new JsonResponse(['error' => 'Invalid JSON'], 400);
        }

        $success = $this->repository->updateMultiple($data);

        if ($success) {
            return new JsonResponse(['message' => 'Configuración guardada correctamente']);
        } else {
            return new JsonResponse(['error' => 'Error al guardar la configuración'], 500);
        }
    }
}
