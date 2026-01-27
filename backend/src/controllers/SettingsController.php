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
    public function testConnection(): JsonResponse
    {
        // Simple connectivity check (can be improved by actually calling Graph)
        // For now, we check if credentials are present
        $clientId = $this->repository->getByKey('ms_graph_client_id');
        $clientSecret = $this->repository->getByKey('ms_graph_client_secret');
        $tenantId = $this->repository->getByKey('ms_graph_tenant_id');

        if (empty($clientId) || empty($clientSecret) || empty($tenantId)) {
            return new JsonResponse([
                'status' => 'error', 
                'message' => 'Faltan credenciales (Client ID, Secret o Tenant ID)'
            ], 400);
        }

        // Try to authenticate using GraphIngestionService
        try {
            $service = new \Olympus\Services\GraphIngestionService();
            // We need a public method in Service to test auth only
            // For now, we can catch the error during constructor or create a specific method
            // Since constructor loads settings, and authentication happens later...
            // Let's modify GraphIngestionService to have a testAuth method or just instantiate and try token.
            
            // As a quick check, we can rely on a try-catch block wrapping a token fetch attempt
            // Assuming we modify Service to expose a test method, OR just do it here using Guzzle
            $guzzle = new \GuzzleHttp\Client();
            $url = 'https://login.microsoftonline.com/' . $tenantId . '/oauth2/v2.0/token';
            $response = $guzzle->post($url, [
                'form_params' => [
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                    'scope' => 'https://graph.microsoft.com/.default',
                    'grant_type' => 'client_credentials',
                ],
            ]);
            
            return new JsonResponse(['status' => 'success', 'message' => 'Conexión exitosa con Microsoft Graph']);
        } catch (\GuzzleHttp\Exception\ClientException $e) {
            $responseBody = $e->getResponse() ? $e->getResponse()->getBody()->getContents() : 'No response body';
            return new JsonResponse([
                'status' => 'error', 
                'message' => 'Error de autenticación (4xx): ' . $e->getMessage() . ' | Detalles: ' . $responseBody
            ], 400);
        } catch (\Exception $e) {
            return new JsonResponse([
                'status' => 'error', 
                'message' => 'Error de conexión: ' . $e->getMessage()
            ], 500);
        }
    }

    public function triggerExtraction(Request $request): JsonResponse
    {
        set_time_limit(0); 

        try {
            // Requirement: "Base de datos debe ser borrada para que no cargue datos de produccion en simulacion"
            // So we WIPE the DB first. Pass 'false' to NOT re-seed.
            $this->repository->resetData(false);

            // Clear log file
            $logFile = __DIR__ . '/../../storage/logs/ingestion.log';
            file_put_contents($logFile, ''); 

            $service = new \Olympus\Services\GraphIngestionService();
            $service->ingestAll();
            
            $this->repository->update('system_last_sync', date('Y-m-d H:i:s'));
            
            return new JsonResponse([
                'status' => 'success', 
                'message' => 'Extracción completada',
                'logs' => file_get_contents($logFile)
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'status' => 'error', 
                'message' => 'Error durante la extracción: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getLogs(): JsonResponse
    {
        $logFile = __DIR__ . '/../../storage/logs/ingestion.log';
        if (!file_exists($logFile)) {
            return new JsonResponse(['logs' => '']);
        }
        return new JsonResponse(['logs' => file_get_contents($logFile)]);
    }

    public function wipeDatabase(): JsonResponse
    {
        try {
            // resetData(false) wipes without reseeding
            $this->repository->resetData(false);
            return new JsonResponse(['status' => 'success', 'message' => 'Base de datos borrada correctamente.']);
        } catch (\Exception $e) {
            return new JsonResponse(['status' => 'error', 'message' => 'Error al borrar la base de datos: ' . $e->getMessage()], 500);
        }
    }

    public function seedDatabase(): JsonResponse
    {
        try {
            // resetData(true) wipes and then seeds
            // Use this for "Simulate" (Clean slate demo)
            $this->repository->resetData(true);
            return new JsonResponse(['status' => 'success', 'message' => 'Carga de datos de simulación (120 usuarios) completada.']);
        } catch (\Exception $e) {
            return new JsonResponse(['status' => 'error', 'message' => 'Error al simular datos: ' . $e->getMessage()], 500);
        }
    }
}
