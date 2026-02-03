<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Microsoft\Graph\Graph;
use GuzzleHttp\Client;
use Olympus\Db\Connection;
use Olympus\Db\SettingRepository;

try {
    echo "--- DIAGNOSTIC: TEAMS CALL RECORDS ACCESS ---\n";
    $db = Connection::get();
    $repo = new SettingRepository();

    $clientId = $repo->getByKey('ms_graph_client_id', $_ENV['MS_GRAPH_CLIENT_ID'] ?? '');
    $clientSecret = $repo->getByKey('ms_graph_client_secret', $_ENV['MS_GRAPH_CLIENT_SECRET'] ?? '');
    $tenantId = $repo->getByKey('ms_graph_tenant_id', $_ENV['MS_GRAPH_TENANT_ID'] ?? '');

    if (empty($clientId) || empty($clientSecret) || empty($tenantId)) {
        die("Error: Missing credentials in DB/ENV.\n");
    }

    echo "Authenticating...\n";
    $guzzle = new Client();
    $url = 'https://login.microsoftonline.com/' . $tenantId . '/oauth2/v2.0/token';
    $authResponse = $guzzle->post($url, [
        'form_params' => [
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'scope' => 'https://graph.microsoft.com/.default',
            'grant_type' => 'client_credentials',
        ],
    ]);
    
    $body = json_decode($authResponse->getBody()->getContents());
    $accessToken = $body->access_token;
    echo "Authentication Successful.\n";
    
    $graph = new Graph();
    $graph->setAccessToken($accessToken);

    // Use 28 days to be safe within the 30-day limit
    $startDate = (new \DateTime())->modify("-28 days")->format('Y-m-d\TH:i:s\Z');
    $endpoint = "/communications/callRecords?\$filter=startDateTime ge {$startDate}";

    echo "Fetching: $endpoint\n";

    try {
        $request = $graph->createRequest('GET', $endpoint);
        $response = $request->execute();
        $data = $response->getBody();

        $count = count($data['value'] ?? []);
        echo "SUCCESS! Found $count records.\n";
        
        if ($count > 0) {
            print_r($data['value'][0]);
        } else {
            echo "Response was empty list. Permissions OK, but no data found in tenant.\n";
        }

    } catch (\Exception $e) {
        echo "\nERROR FETCHING CALL RECORDS:\n";
        echo $e->getMessage() . "\n";
        
        // Check for specific permission error
        if (strpos($e->getMessage(), 'Forbidden') !== false) {
            echo "\n!!! CRITICAL: 403 Forbidden. This confirms the app is missing 'CallRecords.Read.All' permission in Azure AD.\n";
        }
    }

} catch (Exception $e) {
    echo "General Error: " . $e->getMessage() . "\n";
}
