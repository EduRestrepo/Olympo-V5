<?php

namespace Olympus\Services;

use Microsoft\Graph\Graph;
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

        $testUsersStr = $repo->getByKey('mandatory_users', $_ENV['MANDATORY_USERS'] ?? ($_ENV['TEST_TARGET_USERS'] ?? ''));
        if (!empty($testUsersStr)) {
            // Split by comma, semicolon, or newline
            $this->testTargetUsers = preg_split('/[\s,;]+/', $testUsersStr, -1, PREG_SPLIT_NO_EMPTY);
        }

        $excludedStr = $repo->getByKey('excluded_users', $_ENV['EXCLUDED_USERS'] ?? '');
        if (!empty($excludedStr)) {
            $this->excludedUsers = preg_split('/[\s,]+/', strtolower($excludedStr), -1, PREG_SPLIT_NO_EMPTY);
        }

        $this->maxUsersToFetch = (int) $repo->getByKey('extraction_max_users', 100);

        $this->graph = new Graph();
    }

    private function log(string $message): void
    {
        $logFile = __DIR__ . '/../../storage/logs/ingestion.log';
        $timestamp = date('Y-m-d H:i:s');
        $formattedMessage = "[$timestamp] $message" . PHP_EOL;
        
        // Write to file
        file_put_contents($logFile, $formattedMessage, FILE_APPEND);
        
        // Also echo for CLI
        // echo $formattedMessage;
    }

    public function authenticate(): void
    {
        $this->log("Authenticating with Azure AD...");

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
            $this->log("Authentication successful.");
        } catch (\Exception $e) {
            $this->log("Error authenticating: " . $e->getMessage());
            throw new \Exception("Error authenticating: " . $e->getMessage());
        }
    }

    public function ingestAll(): void
    {
        $this->authenticate();

        $this->log("Starting ingestion in mode: " . $this->ingestionMode);

        $users = $this->getUsersToProcess();
        $this->log("Found " . count($users) . " users to process.");

        foreach ($users as $user) {
            // $user is now array
            $email = $user['mail'] ?? ($user['userPrincipalName'] ?? null);
            
            if (empty($email)) {
                $this->log("Skipping user without email.");
                continue;
            }

            $this->log("Processing User: $email");
            
            // 0. Upsert Actor (Sync Department/Country)
            $userId = $this->upsertActor($user);

            // 1. Emails Metadata
            $this->getMailMetadata($user['id'], $email, $userId);
        }

        // 2. Teams Calls Metadata - Fetch ONCE for all users to optimize
        $this->getTeamsCallMetadataGlobal($users);

        $this->log("Calculating Aggregated Metrics (Pulse, Totals, Tone)...");
        try {
            $metricService = new \Olympus\Services\MetricService();
            $metricService->calculateAggregates();
        } catch (\Exception $e) {
            $this->log("Error calculating metrics: " . $e->getMessage());
        }

        $this->log("Ingestion completed successfully.");
    }

    private function getUsersToProcess(): array
    {
        $allUsers = [];
        $processedEmails = [];

        // 1. Fetch Mandatory Users Explicitly
        if (!empty($this->testTargetUsers)) {
            $this->log("Fetching " . count($this->testTargetUsers) . " mandatory users...");
            foreach ($this->testTargetUsers as $targetEmail) {
                if (empty($targetEmail)) continue;
                try {
                    $url = "/users/$targetEmail?\$select=id,displayName,mail,jobTitle,department,country,userPrincipalName";
                    $request = $this->graph->createRequest('GET', $url);
                    $response = $request->execute();
                    
                    if (method_exists($response, 'getBody')) {
                        $body = $response->getBody();
                    } else {
                        $body = $response;
                    }

                    if (is_array($body)) { // GraphResponse usually returns array/map for single entity
                        $allUsers[] = $body;
                        $processedEmails[] = strtolower($targetEmail);
                    }
                } catch (\Exception $e) {
                     $this->log("Could not fetch mandatory user $targetEmail: " . $e->getMessage());
                }
            }
        }

        // 2. Fill with other users if space remains
        if (count($allUsers) < $this->maxUsersToFetch) {
            $remainingSlots = $this->maxUsersToFetch - count($allUsers);
            $url = "/users?\$select=id,displayName,mail,jobTitle,department,country,userPrincipalName&\$top={$remainingSlots}";

            try {
                $request = $this->graph->createRequest('GET', $url);
                $response = $request->execute();
                
                if (method_exists($response, 'getBody')) {
                    $body = $response->getBody();
                } else {
                    $body = $response;
                }
                
                $users = $body['value'] ?? [];
                
                foreach ($users as $user) {
                    if (count($allUsers) >= $this->maxUsersToFetch) break;
                    if (!is_array($user)) continue;
                    
                    $email = $user['mail'] ?? ($user['userPrincipalName'] ?? null);
                    
                    if (empty($email)) continue;
                    $trimmedEmail = strtolower(trim($email));
                    if (in_array($trimmedEmail, $processedEmails)) continue; // Avoid duplicates
                    if (in_array($trimmedEmail, $this->excludedUsers)) continue;

                    $allUsers[] = $user;
                }
            } catch (\Exception $e) {
                $this->log("Error fetching bulk users: " . $e->getMessage());
            }
        }

        $this->log("Ingestion ready. Total unique users to process: " . count($allUsers));
        return $allUsers;
    }

    private function upsertActor(array $user): int
    {
        $email = strtolower(trim($user['mail'] ?? ($user['userPrincipalName'] ?? null)));
        $name = $user['displayName'] ?? 'Unknown';
        $jobTitle = $user['jobTitle'] ?? 'Unknown';
        $department = $user['department'] ?? 'General';
        $country = $user['country'] ?? 'Unknown';

        // Check if exists
        $stmt = $this->db->prepare("SELECT id FROM actors WHERE email = :email");
        $stmt->execute(['email' => $email]);
        $existing = $stmt->fetch(\PDO::FETCH_ASSOC);

        if ($existing) {
            $id = (int) $existing['id'];
            // Update
            $update = $this->db->prepare("UPDATE actors SET name = :name, role = :role, department = :dept, country = :country WHERE id = :id");
            $update->execute([
                'name' => $name,
                'role' => $jobTitle,
                'dept' => $department,
                'country' => $country,
                'id' => $id
            ]);
            return $id;
        } else {
            // Insert
            $insert = $this->db->prepare("INSERT INTO actors (name, role, badge, department, country, email, escalation_score) VALUES (:name, :role, '♙', :dept, :country, :email, 0) RETURNING id");
            $insert->execute([
                'name' => $name,
                'role' => $jobTitle,
                'dept' => $department,
                'country' => $country,
                'email' => $email
            ]);
            return (int) $insert->fetchColumn();
        }
    }

    private function getTeamsCallMetadataGlobal(array $processedUsers): void
    {
        $repo = new \Olympus\Db\SettingRepository();
        $lookbackDays = max(15, (int) $repo->getByKey('extraction_lookback_days', 30));
        $startDate = (new \DateTime())->modify("-{$lookbackDays} days")->format('Y-m-d\TH:i:s\Z');

        $this->log("Fetching global Teams call records (last $lookbackDays days)...");

        try {
            // Fetch all call records in one go
            $request = $this->graph->createRequest('GET', "/communications/callRecords?\$filter=startDateTime ge {$startDate}");
            $response = $request->execute();
            
            $body = method_exists($response, 'getBody') ? $response->getBody() : $response;
            $callRecords = $body['value'] ?? []; 
            
            if (empty($callRecords)) {
                $this->log("No Teams call records found for this period.");
                return;
            }

            // Create a map of Graph User ID -> DB Actor ID for fast lookup
            $userMap = [];
            foreach ($processedUsers as $u) {
                if (isset($u['id'])) {
                    $email = strtolower(trim($u['mail'] ?? ($u['userPrincipalName'] ?? '')));
                    $dbId = $this->getDbIdByEmail($email);
                    if ($dbId) {
                        $userMap[$u['id']] = $dbId;
                    }
                }
            }

            $count = 0;
            foreach ($callRecords as $record) {
                if (!is_array($record)) continue;
                
                $organizer = $record['organizer'] ?? null;
                $participants = $record['participants'] ?? [];
                
                // Identify which of our target users are in this call
                $involvedUsers = []; // Graphite User ID -> isOrganizer
                
                if ($organizer && isset($organizer['user']['id']) && isset($userMap[$organizer['user']['id']])) {
                    $involvedUsers[$organizer['user']['id']] = true;
                }

                foreach ($participants as $p) {
                    if (isset($p['user']['id']) && isset($userMap[$p['user']['id']])) {
                        // If not already in (as organizer), add as participant
                        if (!isset($involvedUsers[$p['user']['id']])) {
                            $involvedUsers[$p['user']['id']] = false;
                        }
                    }
                }

                if (empty($involvedUsers)) continue;

                $participantCount = count($participants);
                $type = $record['type'] ?? 'unknown';
                $start = isset($record['startDateTime']) ? new \DateTime($record['startDateTime']) : new \DateTime();
                $end = isset($record['endDateTime']) ? new \DateTime($record['endDateTime']) : new \DateTime();
                $duration = $end->getTimestamp() - $start->getTimestamp();
                
                $modalities = $record['modalities'] ?? []; 
                $hasVideo = in_array('video', $modalities);
                $hasScreenShare = in_array('screenShare', $modalities);
                $timestamp = $start->format('Y-m-d H:i:s');

                foreach ($involvedUsers as $graphId => $isOrg) {
                    $dbId = $userMap[$graphId];
                    $this->saveTeamsCallRecord([
                        'user_id' => $dbId,
                        'call_type' => $type,
                        'duration_seconds' => $duration,
                        'participant_count' => $participantCount,
                        'is_organizer' => $isOrg ? 'true' : 'false',
                        'used_video' => $hasVideo ? 'true' : 'false',
                        'used_screenshare' => $hasScreenShare ? 'true' : 'false',
                        'call_timestamp' => $timestamp
                    ]);
                    $count++;
                }
            }

            $this->log("Global Teams sync: Processed $count record-user involvements.");

        } catch (\Exception $e) {
            $this->log("Error during global Teams ingestion: " . $e->getMessage());
        }
    }

    private function getDbIdByEmail(string $email): ?int {
        $stmt = $this->db->prepare("SELECT id FROM actors WHERE email = :email");
        $stmt->execute(['email' => $email]);
        $res = $stmt->fetchColumn();
        return $res ? (int)$res : null;
    }

    private function saveTeamsCallRecord(array $data): void 
    {
        $stmt = $this->db->prepare("INSERT INTO teams_call_records (user_id, call_type, duration_seconds, participant_count, is_organizer, used_video, used_screenshare, call_timestamp) VALUES (:user_id, :call_type, :duration_seconds, :participant_count, :is_organizer, :used_video, :used_screenshare, :call_timestamp)");
        $stmt->execute($data);
    }

    private function getMailMetadata(string $userId, string $userEmail, int $dbUserId): void
    {
        $repo = new \Olympus\Db\SettingRepository();
        $lookbackDays = max(15, (int) $repo->getByKey('EXTRACTION_LOOKBACK_DAYS', 30));
        $startDate = (new \DateTime())->modify("-{$lookbackDays} days")->format('Y-m-d\TH:i:s\Z');
        $queryParams = '$select=subject,sentDateTime,receivedDateTime,sender,from,toRecipients,ccRecipients,importance&$filter=receivedDateTime ge ' . $startDate . '&$top=100';

        try {
            // Remove setReturnType(Model\Message::class)
            $request = $this->graph->createRequest('GET', "/users/$userId/messages?$queryParams");
            $response = $request->execute();
            
            if (method_exists($response, 'getBody')) {
                $body = $response->getBody();
            } else {
                $body = $response;
            }

            $messages = $body['value'] ?? [];
            
            $count = count($messages);
            $this->log("  - Imported $count message headers (last {$lookbackDays} days).");

            $totalEscalations = 0;
            foreach ($messages as $msg) {
                if ($this->calculateEscalationImpact($msg)) {
                    $totalEscalations++;
                    $stmt = $this->db->prepare("UPDATE actors SET escalation_score = escalation_score + 1 WHERE id = ?");
                    $stmt->execute([$dbUserId]);
                }
                
                // NEW: Process Interaction (Influence Graph)
                $this->processEmailInteractions($msg, $dbUserId);
            }

            if ($totalEscalations > 0) {
                $this->log("  - Detected $totalEscalations escalation events.");
            }

        } catch (\Exception $e) {
            $this->log("  - Error fetching messages for $userEmail: " . $e->getMessage());
        }
    }

    private function processEmailInteractions(array $msg, int $targetActorId): void
    {
        // 1. Resolve Sender
        $senderData = $msg['from']['emailAddress'] ?? null;
        if (!$senderData) return;

        $senderEmail = $senderData['address'] ?? null;
        $senderName = $senderData['name'] ?? 'Unknown';

        if (!$senderEmail) return;

        // Create/Get Sender Actor
        $senderActorId = $this->upsertActiveActor($senderName, $senderEmail);

        // If sender is same as target (self-email), ignore for influence graph
        if ($senderActorId === $targetActorId) return;

        // 2. Record Interaction (Sender -> Target)
        // We consider the "User being processed" ($targetActorId) as the RECIPIENT since we are reading their inbox.
        // So Interaction: Sender -> Target
        $this->recordInteraction($senderActorId, $targetActorId, 'Email');

        // 3. Response Time Calculation (Heuristic)
        // If we also find a message FROM Target TO Sender close in time, we could calculate response time.
        // For now, simpler: Just record the volume.
        
        // 4. Also process CCs as targets of the sender
        $ccRecipients = $msg['ccRecipients'] ?? [];
        foreach ($ccRecipients as $cc) {
            $ccEmail = $cc['emailAddress']['address'] ?? null;
            $ccName = $cc['emailAddress']['name'] ?? 'Unknown';
            
            if ($ccEmail) {
                $ccActorId = $this->upsertActiveActor($ccName, $ccEmail);
                if ($ccActorId !== $senderActorId) {
                    $this->recordInteraction($senderActorId, $ccActorId, 'Email');
                }
            }
        }
    }

    private function upsertActiveActor(string $name, string $email): int
    {
        $email = strtolower(trim($email));
        // Similar to upsertActor but simpler, just to ensure ID exists
        $stmt = $this->db->prepare("SELECT id FROM actors WHERE email = :email");
        $stmt->execute(['email' => $email]);
        $id = $stmt->fetchColumn();

        if ($id) return (int)$id;

        // Create new minimal actor
        $insert = $this->db->prepare("INSERT INTO actors (name, role, badge, department, country, email, escalation_score) VALUES (:name, 'Unknown', '♙', 'General', 'Unknown', :email, 0) RETURNING id");
        $insert->execute(['name' => $name, 'email' => $email]);
        return (int)$insert->fetchColumn();
    }

    private function recordInteraction(int $sourceId, int $targetId, string $channel): void
    {
        // Upsert interaction volume
        $stmt = $this->db->prepare("
            INSERT INTO interactions (source_id, target_id, channel, volume) 
            VALUES (:source, :target, :channel, 1)
            ON CONFLICT (source_id, target_id, channel) 
            DO UPDATE SET volume = interactions.volume + 1
        "); // Note: ON CONFLICT requires a unique constraint which we need to check if exists. 
            // If constraint works by id, fine, but typically we need a constraint on (source, target, channel).
            // Let's assume schema allows duplicates or we handle it manually.
            // Actually, the schema doesn't seem to have a UNIQUE constraint on (source, target, channel).
            // Let's check first.
        
        // Manual Upsert check
        $check = $this->db->prepare("SELECT id, volume FROM interactions WHERE source_id = :s AND target_id = :t AND channel = :c");
        $check->execute(['s' => $sourceId, 't' => $targetId, 'c' => $channel]);
        $existing = $check->fetch(\PDO::FETCH_ASSOC);

        if ($existing) {
            $update = $this->db->prepare("UPDATE interactions SET volume = volume + 1 WHERE id = :id");
            $update->execute(['id' => $existing['id']]);
        } else {
            $insert = $this->db->prepare("INSERT INTO interactions (source_id, target_id, channel, volume) VALUES (:s, :t, :c, 1)");
            $insert->execute(['s' => $sourceId, 't' => $targetId, 'c' => $channel]);
        }
    }

    private function calculateEscalationImpact($msg): bool
    {
        // $msg is now an array
        if (!is_array($msg)) return false;

        $ccRecipients = $msg['ccRecipients'] ?? [];
        if (empty($ccRecipients)) return false;

        $importance = $msg['importance'] ?? null; 
        if ($importance && strtolower($importance) === 'high') return true;

        $subject = strtolower($msg['subject'] ?? '');
        if (str_contains($subject, 'urgent') || str_contains($subject, 'attention') || str_contains($subject, 'escalation')) return true;

        return false;
    }
}
