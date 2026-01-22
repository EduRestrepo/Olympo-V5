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
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("UPDATE settings SET value = :value, updated_at = CURRENT_TIMESTAMP WHERE LOWER(key) = LOWER(:key)");
            foreach ($settings as $key => $value) {
                $stmt->execute([
                    'key' => $key,
                    'value' => (string) $value
                ]);
            }
            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }
}
