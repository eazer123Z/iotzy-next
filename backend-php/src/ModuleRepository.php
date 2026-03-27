<?php

declare(strict_types=1);

namespace App;

use PDO;

final class ModuleRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    /** @return array<int, array<string, mixed>> */
    public function devices(int $userId): array
    {
        $stmt = $this->pdo->prepare('SELECT id, device_key, name, type, latest_state, last_seen FROM devices WHERE user_id = :uid ORDER BY created_at ASC LIMIT 100');
        $stmt->execute(['uid' => $userId]);
        return $stmt->fetchAll() ?: [];
    }

    /** @return array<int, array<string, mixed>> */
    public function sensors(int $userId): array
    {
        $stmt = $this->pdo->prepare('SELECT id, sensor_key, name, type, unit, latest_value, last_seen FROM sensors WHERE user_id = :uid ORDER BY created_at ASC LIMIT 100');
        $stmt->execute(['uid' => $userId]);
        return $stmt->fetchAll() ?: [];
    }

    /** @return array<int, array<string, mixed>> */
    public function automation(int $userId): array
    {
        $stmt = $this->pdo->prepare('SELECT id, device_id, sensor_id, condition_type, action, is_enabled FROM automation_rules WHERE user_id = :uid ORDER BY created_at DESC LIMIT 100');
        $stmt->execute(['uid' => $userId]);
        return $stmt->fetchAll() ?: [];
    }

    /** @return array<string, mixed> */
    public function settings(int $userId): array
    {
        $stmt = $this->pdo->prepare('SELECT mqtt_broker, mqtt_port, mqtt_use_ssl, theme FROM user_settings WHERE user_id = :uid LIMIT 1');
        $stmt->execute(['uid' => $userId]);
        return $stmt->fetch() ?: [];
    }
}
