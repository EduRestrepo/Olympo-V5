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
            error_log("SettingsController::saveSettings - Invalid JSON received: " . substr($json, 0, 100));
            return new JsonResponse(['error' => 'Invalid JSON'], 400);
        }

        // Validate critical fields if necessary (optional)
        // error_log("Attempting to save settings: " . print_r(array_keys($data), true));

        $success = $this->repository->updateMultiple($data);

        if ($success) {
            return new JsonResponse(['message' => 'Configuración guardada correctamente']);
        } else {
            error_log("SettingsController::saveSettings - Repository update failed");
            return new JsonResponse(['error' => 'Error al guardar la configuración en base de datos'], 500);
        }
    }
    public function testConnection(Request $request): JsonResponse
    {
        // 1. Try to get credentials from Request Body (Priority)
        $json = $request->getContent();
        $data = json_decode($json, true) ?? [];

        $clientId = $data['ms_graph_client_id'] ?? null;
        $clientSecret = $data['ms_graph_client_secret'] ?? null;
        $tenantId = $data['ms_graph_tenant_id'] ?? null;

        // 2. Fallback to Database if not provided in request
        if (empty($clientId) || empty($clientSecret) || empty($tenantId)) {
            $clientId = $this->repository->getByKey('ms_graph_client_id');
            $clientSecret = $this->repository->getByKey('ms_graph_client_secret');
            $tenantId = $this->repository->getByKey('ms_graph_tenant_id');
        }

        if (empty($clientId) || empty($clientSecret) || empty($tenantId)) {
            return new JsonResponse([
                'status' => 'error', 
                'message' => 'Faltan credenciales (Client ID, Secret o Tenant ID). Por favor ingresea los datos.'
            ], 400);
        }

        // Try to authenticate using Guzzle directly to verify credentials
        try {
            $guzzle = new \GuzzleHttp\Client();
            $url = 'https://login.microsoftonline.com/' . $tenantId . '/oauth2/v2.0/token';
            
            $response = $guzzle->post($url, [
                'form_params' => [
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                    'scope' => 'https://graph.microsoft.com/.default',
                    'grant_type' => 'client_credentials',
                ],
                'timeout' => 10 // Set a timeout
            ]);
            
            $body = json_decode($response->getBody(), true);
            
            if (isset($body['access_token'])) {
                 return new JsonResponse(['status' => 'success', 'message' => 'Conexión exitosa con Microsoft Graph. Credenciales válidas.']);
            } else {
                 return new JsonResponse(['status' => 'error', 'message' => 'Respuesta inesperada de Microsoft (No Token)'], 500);
            }

        } catch (\GuzzleHttp\Exception\ClientException $e) {
            $responseBody = $e->getResponse() ? $e->getResponse()->getBody()->getContents() : 'No response body';
            // Parse common MS Graph errors
            $errorJson = json_decode($responseBody, true);
            $errorDesc = $errorJson['error_description'] ?? $errorJson['error'] ?? $e->getMessage();

            return new JsonResponse([
                'status' => 'error', 
                'message' => 'Error de autenticación: ' . $errorDesc
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
        } catch (\Throwable $e) {
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

            // Important: Recalculate metrics so dashboard is populated immediately
            $metricService = new \Olympus\Services\MetricService();
            $metricService->calculateAggregates();

            return new JsonResponse(['status' => 'success', 'message' => 'Carga de datos de simulación (120 usuarios) completada.']);
        } catch (\Exception $e) {
            return new JsonResponse(['status' => 'error', 'message' => 'Error al simular datos: ' . $e->getMessage()], 500);
        }
    }
}
