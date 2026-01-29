<?php

namespace Olympus\Db;

use PDO;

class SettingRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Connection::get();
    }

    public function getAll(): array
    {
        $stmt = $this->db->query("SELECT * FROM settings ORDER BY key ASC");
        return $stmt->fetchAll();
    }

    public function getByKey(string $key, $default = null): ?string
    {
        $stmt = $this->db->prepare("SELECT value FROM settings WHERE LOWER(key) = LOWER(:key)");
        $stmt->execute(['key' => $key]);
        $result = $stmt->fetch();
        return $result ? $result['value'] : $default;
    }

    public function update(string $key, string $value): bool
    {
        $stmt = $this->db->prepare("UPDATE settings SET value = :value, updated_at = CURRENT_TIMESTAMP WHERE LOWER(key) = LOWER(:key)");
        return $stmt->execute([
            'key' => $key,
            'value' => $value
        ]);
    }

    public function updateMultiple(array $settings): bool
    {
        // $this->db->beginTransaction();
        try {
            // Postgres UPSERT syntax
            $sql = "INSERT INTO settings (key, value, updated_at) 
                    VALUES (:key, :value, CURRENT_TIMESTAMP) 
                    ON CONFLICT (key) 
                    DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP";
            
            $stmt = $this->db->prepare($sql);
            
            foreach ($settings as $key => $value) {
                // Ensure value is string
                $valStr = is_bool($value) ? ($value ? 'true' : 'false') : (string) $value;
                $stmt->execute([
                    'key' => $key,
                    'value' => $valStr
                ]);
            }
            // $this->db->commit();
            return true;
        } catch (\Exception $e) {
            // $this->db->rollBack();
            error_log("Settings Repository Error: " . $e->getMessage());
            return false;
        }
    }

    public function resetData(bool $reSeed = true): bool
    {
        // Order matters due to foreign keys
        $tables = [
            'teams_call_records', 
            'influence_links', 
            'interactions', 
            'response_times',
            'channel_totals',
            'tone_index_daily',
            'network_pulse_daily',
            'actors' // This implies clearing all data
        ];
        
        foreach ($tables as $table) {
            $this->db->exec("TRUNCATE TABLE $table CASCADE");
        }

        // Only re-seed if requested AND not in production (safety)
        // Although the user might WANT seed in prod if they explicit ask? 
        // Logic: If $reSeed is true, we try to seed.
        // We still keep the prod check as a safety unless we want to allow "Demo Mode in Prod".
        // Let's stick to: If $reSeed is TRUE AND APP_ENV != PROD.
        
        if ($reSeed) {
            $env = $this->getByKey('app_env', $_ENV['APP_ENV'] ?? 'dev');
            if (strtolower($env) !== 'prod') {
                $seedFile = __DIR__ . '/seed.sql';
                if (file_exists($seedFile)) {
                    $sql = file_get_contents($seedFile);
                    // Simple split by semicolon to handle multi-statement files
                    // Note: This is a simple heuristic and might fail with semicolons in strings, 
                    // but for seed.sql it should be fine.
                    $statements = array_filter(array_map('trim', explode(';', $sql)));
                    foreach ($statements as $stmt) {
                        if (!empty($stmt)) {
                            $this->db->exec($stmt);
                        }
                    }
                } else {
                    throw new \Exception("Seed file not found at $seedFile");
                }
            }
        }

        return true;
    }
}
