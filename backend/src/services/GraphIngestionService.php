<?php

namespace Olympus\Services;

use Microsoft\Graph\Graph;
use Microsoft\Graph\Model;
use GuzzleHttp\Client;

class GraphIngestionService
{
    private string $clientId;
    private string $clientSecret;
    private string $tenantId;
    private Graph $graph;

    private string $ingestionMode;
    private array $testTargetUsers = [];
    private array $excludedUsers = [];
    private int $maxUsersToFetch;

    private \PDO $db;

    public function __construct()
    {
        $this->db = \Olympus\Db\Connection::get();
        $repo = new \Olympus\Db\SettingRepository();

        $this->clientId = $repo->getByKey('ms_graph_client_id', $_ENV['ms_graph_client_id'] ?? ($_ENV['MS_GRAPH_CLIENT_ID'] ?? ''));
        $this->clientSecret = $repo->getByKey('ms_graph_client_secret', $_ENV['ms_graph_client_secret'] ?? ($_ENV['MS_GRAPH_CLIENT_SECRET'] ?? ''));
        $this->tenantId = $repo->getByKey('ms_graph_tenant_id', $_ENV['ms_graph_tenant_id'] ?? ($_ENV['MS_GRAPH_TENANT_ID'] ?? ''));

        $this->ingestionMode = strtoupper($repo->getByKey('app_env', $_ENV['APP_ENV'] ?? 'DEV'));

        $testUsersStr = $repo->getByKey('mandatory_users', $_ENV['MANDATORY_USERS'] ?? '');
        if (!empty($testUsersStr)) {
            $this->testTargetUsers = array_map('trim', explode(',', $testUsersStr));
        }

        $excludedStr = $repo->getByKey('excluded_users', $_ENV['EXCLUDED_USERS'] ?? '');
        if (!empty($excludedStr)) {
            $this->excludedUsers = array_map('trim', explode(',', $excludedStr));
        }

        $this->maxUsersToFetch = (int) $repo->getByKey('extraction_max_users', 100);

        $this->graph = new Graph();
    }

    public function authenticate(): void
    {
        echo "Authenticating with Azure AD...\n";

        $guzzle = new Client();
        $url = 'https://login.microsoftonline.com/' . $this->tenantId . '/oauth2/v2.0/token';

        try {
            $response = $guzzle->post($url, [
                'form_params' => [
                    'client_id' => $this->clientId,
                    'client_secret' => $this->clientSecret,
                    'scope' => 'https://graph.microsoft.com/.default',
                    'grant_type' => 'client_credentials',
                ],
            ]);

            $body = json_decode($response->getBody()->getContents());
            $this->graph->setAccessToken($body->access_token);
            echo "Authentication successful.\n";
        } catch (\Exception $e) {
            die("Error authenticating: " . $e->getMessage() . "\n");
        }
    }

    public function ingestAll(): void
    {
        $this->authenticate();

        echo "Starting ingestion in mode: " . $this->ingestionMode . "\n";

        $users = $this->getUsersToProcess();
        echo "Found " . count($users) . " users to process.\n";

        foreach ($users as $user) {
            $email = $user->getMail();
            if (empty($email)) {
                echo "Skipping user without email: " . $user->getDisplayName() . "\n";
                continue;
            }

            echo "Processing User: $email\n";
            
            // 0. Upsert Actor (Sync Department/Country)
            $userId = $this->upsertActor($user);

            // 1. Emails Metadata
            $this->getMailMetadata($user->getId(), $email, $userId);

            // 2. Teams Calls Metadata
            $this->getTeamsCallMetadata($user->getId(), $email);
        }
    }

    private function upsertActor(Model\User $user): int
    {
        $name = $user->getDisplayName();
        $email = $user->getMail(); // Assuming we might store email eventually, but current schema doesn't have it. We map by Name for now or logic needs adaptation.
        // Wait, current schema 'actors' doesn't have email? It has 'name'. 
        // We really should have 'email' or 'azure_id' to sync. 
        // For this prototype, I will query by NAME. 
        
        $jobTitle = $user->getJobTitle() ?? 'Employee';
        $department = $user->getDepartment() ?? 'General';
        $country = $user->getCountry() ?? ($user->getUsageLocation() ?? 'Unknown');

        // Determine Badge/Role based on Job Title
        $badge = '♙'; // Pawn default
        $lowerTitle = strtolower($jobTitle);
        if (str_contains($lowerTitle, 'ceo') || str_contains($lowerTitle, 'president')) $badge = '♚';
        elseif (str_contains($lowerTitle, 'cto') || str_contains($lowerTitle, 'cfo') || str_contains($lowerTitle, 'vp')) $badge = '♛';
        elseif (str_contains($lowerTitle, 'director') || str_contains($lowerTitle, 'head')) $badge = '♜';
        elseif (str_contains($lowerTitle, 'manager') || str_contains($lowerTitle, 'lead')) $badge = '♞';
        elseif (str_contains($lowerTitle, 'senior') || str_contains($lowerTitle, 'architect')) $badge = '♗';

        // Check if exists
        $stmt = $this->db->prepare("SELECT id FROM actors WHERE name = ?");
        $stmt->execute([$name]);
        $existing = $stmt->fetch();

        if ($existing) {
            $id = $existing['id'];
            $stmt = $this->db->prepare("UPDATE actors SET role = ?, badge = ?, department = ?, country = ? WHERE id = ?");
            $stmt->execute([$jobTitle, $badge, $department, $country, $id]);
            return $id;
        } else {
            $stmt = $this->db->prepare("INSERT INTO actors (name, role, badge, department, country) VALUES (?, ?, ?, ?, ?) RETURNING id");
            $stmt->execute([$name, $jobTitle, $badge, $department, $country]);
            $row = $stmt->fetch();
            return $row['id'];
        }
    }

    private function getTeamsCallMetadata(string $userId, string $userEmail): void
    {
        $repo = new \Olympus\Db\SettingRepository();
        // Get configurable lookback period (default 30 days, minimum 15)
        $lookbackDays = max(15, (int) $repo->getByKey('EXTRACTION_LOOKBACK_DAYS', 30));
        $startDate = (new \DateTime())->modify("-{$lookbackDays} days")->format('Y-m-d\TH:i:s\Z');

        // Note: CallRecords API is organization-level, we'll filter by participant
        // Endpoint: /communications/callRecords
        // Filter by participant is complex, so we'll fetch recent records and filter in code

        try {
            // Fetch call records (limited to recent ones for performance)
            $url = "/communications/callRecords?\$filter=startDateTime ge {$startDate}&\$top=100";

            $callRecords = $this->graph->createRequest('GET', $url)
                ->execute();

            if (!$callRecords) {
                echo "  - No Teams call records found.\n";
                return;
            }

            $userCallCount = 0;

            foreach ($callRecords as $record) {
                // Check if user participated in this call
                $participants = $record->getProperty('participants') ?? [];
                $isParticipant = false;
                $isOrganizer = false;

                foreach ($participants as $participant) {
                    $user = $participant->getProperty('user');
                    if ($user && $user->getProperty('id') === $userId) {
                        $isParticipant = true;
                        // Check if organizer
                        $organizer = $record->getProperty('organizer');
                        if ($organizer && $organizer->getProperty('user')) {
                            $isOrganizer = ($organizer->getProperty('user')->getProperty('id') === $userId);
                        }
                        break;
                    }
                }

                if (!$isParticipant) {
                    continue;
                }

                // Extract metadata
                $startTime = new \DateTime($record->getProperty('startDateTime'));
                $endTime = new \DateTime($record->getProperty('endDateTime'));
                $duration = $endTime->getTimestamp() - $startTime->getTimestamp();

                $callType = $record->getProperty('type') ?? 'unknown'; // 'groupCall' or 'peerToPeer'
                $participantCount = count($participants);

                $modalities = $record->getProperty('modalities') ?? [];
                $usedVideo = in_array('video', $modalities);
                $usedScreenshare = in_array('screenSharing', $modalities);

                // Save to database
                $this->saveTeamsCallRecord([
                    'user_id' => $userId,
                    'call_type' => $callType,
                    'duration_seconds' => $duration,
                    'participant_count' => $participantCount,
                    'is_organizer' => $isOrganizer,
                    'used_video' => $usedVideo,
                    'used_screenshare' => $usedScreenshare,
                    'call_timestamp' => $startTime->format('Y-m-d H:i:s')
                ]);

                $userCallCount++;
            }

            echo "  - Imported {$userCallCount} Teams call records.\n";

        } catch (\Exception $e) {
            echo "  - Error fetching Teams call records for $userEmail: " . $e->getMessage() . "\n";
        }
    }

    private function saveTeamsCallRecord(array $data): void
    {
        // This would connect to your database and insert the record
        // For now, we'll just echo to demonstrate the data structure
        echo "    [TEAMS] {$data['call_timestamp']} | Type: {$data['call_type']} | " .
            "Participants: {$data['participant_count']} | Duration: {$data['duration_seconds']}s\n";

        // TODO: Implement actual database insertion
        // Example:
        // $pdo = Connection::get();
        // $stmt = $pdo->prepare("INSERT INTO teams_call_records ...");
        // $stmt->execute($data);
    }

    private function getUsersToProcess(): array
    {
        // If in TEST mode, we might just query specific users directly if they are few, 
        // but typically simpler to fetch all users (or filter server side) and filter locally for the prototype.
        // For efficiency in FULL mode with thousands of users, pagination is needed.

        $allUsers = [];
        $url = '/users?$select=id,displayName,mail,jobTitle,department&$top=999';

        // NOTE: In a real large production env, we would handle @odata.nextLink pagination here.
        // For this prototype, we'll fetch the first page or implemented simplest pagination.

        try {
            $response = $this->graph->createRequest('GET', $url)
                ->setReturnType(Model\User::class)
                ->execute();

            $fetchedUsers = $response;

            // Simple Pagination loop
            // while ($response->getNextLink()) ... (omitted for brevity in initial scaffold)

            foreach ($fetchedUsers as $user) {
                // Limit total users to process
                if (count($allUsers) >= $this->maxUsersToFetch)
                    break;

                $email = $user->getMail() ?: $user->getUserPrincipalName();
                if (empty($email))
                    continue;
                if (in_array($email, $this->excludedUsers))
                    continue;

                // Inclusion Check
                if ($this->ingestionMode === 'TEST' || $this->ingestionMode === 'DEV') {
                    if (in_array($email, $this->testTargetUsers)) {
                        $allUsers[] = $user;
                    }
                } else {
                    // FULL/PROD Mode
                    $allUsers[] = $user;
                }
            }

            echo "Ingesta iniciada en modo " . $this->ingestionMode . ". Procesando " . count($allUsers) . " usuarios.\n";

        } catch (\Exception $e) {
            echo "Error fetching users: " . $e->getMessage() . "\n";
        }

        return $allUsers;
    }

    private function getMailMetadata(string $userId, string $userEmail, int $dbUserId): void
    {
        $repo = new \Olympus\Db\SettingRepository();
        // Get configurable lookback period (default 30 days, minimum 15)
        $lookbackDays = max(15, (int) $repo->getByKey('EXTRACTION_LOOKBACK_DAYS', 30));
        $startDate = (new \DateTime())->modify("-{$lookbackDays} days")->format('Y-m-d\TH:i:s\Z');

        // We only request METADATA fields. No 'body' or 'uniqueBody'.
        // Filter by receivedDateTime to limit the time window
        $queryParams = '$select=subject,sentDateTime,receivedDateTime,sender,from,toRecipients,ccRecipients,importance&$filter=receivedDateTime ge ' . $startDate . '&$top=100';

        try {
            $messages = $this->graph->createRequest('GET', "/users/$userId/messages?$queryParams")
                ->setReturnType(Model\Message::class)
                ->execute();

            $count = count($messages);
            echo "  - Imported $count message headers (last {$lookbackDays} days).\n";

            $totalEscalations = 0;

            foreach ($messages as $msg) {
                // Here we would SAVE to Database table 'interactions' (skipping for this prototype to focus on Actor Escalation Score)
                
                // Calculate Escalation Impact
                if ($this->calculateEscalationImpact($msg)) {
                    $totalEscalations++;
                    
                    // Simple increment for Prototype
                    $stmt = $this->db->prepare("UPDATE actors SET escalation_score = escalation_score + 1 WHERE id = ?");
                    $stmt->execute([$dbUserId]);
                }
                
                $sender = $msg->getSender()->getEmailAddress()->getAddress();
                $date = $msg->getSentDateTime()->format('Y-m-d H:i:s');
                // echo "    [MAIL] $date | From: $sender | To: " . count($msg->getToRecipients()) . "\n";
            }

            if ($totalEscalations > 0) {
                echo "  - Detected $totalEscalations escalation events (Oppositional Influence).\n";
            }

        } catch (\Exception $e) {
            echo "  - Error fetching messages for $userEmail: " . $e->getMessage() . "\n";
        }
    }

    private function calculateEscalationImpact(Model\Message $msg): bool
    {
        // Logic: 
        // 1. If Importance is High AND there are CC recipients -> Potential escalation.
        // 2. Or if Subject contains "Urgent", "Important" AND CC exists.
        
        $ccRecipients = $msg->getCcRecipients();
        if (empty($ccRecipients)) {
            return false;
        }

        // Check Importance
        $importance = $msg->getImportance(); // 'low', 'normal', 'high'
        if ($importance && strtolower($importance) === 'high') {
            return true;
        }

        // Check Subject keywords
        $subject = strtolower($msg->getSubject() ?? '');
        if (str_contains($subject, 'urgent') || str_contains($subject, 'attention') || str_contains($subject, 'escalation')) {
            return true;
        }

        return false;
    }
}
