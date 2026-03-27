<?php

declare(strict_types=1);

namespace App;

use PDO;

final class DashboardRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    /** @return array<string, int> */
    public function stats(int $userId): array
    {
        $deviceStmt = $this->pdo->prepare('SELECT COUNT(*) AS total, COALESCE(SUM(latest_state), 0) AS active FROM devices WHERE user_id = :uid');
        $deviceStmt->execute(['uid' => $userId]);
        $device = $deviceStmt->fetch() ?: ['total' => 0, 'active' => 0];

        $sensorStmt = $this->pdo->prepare('SELECT COUNT(*) AS total FROM sensors WHERE user_id = :uid');
        $sensorStmt->execute(['uid' => $userId]);
        $sensor = $sensorStmt->fetch() ?: ['total' => 0];

        return [
            'totalDevices' => (int) $device['total'],
            'activeDevices' => (int) $device['active'],
            'totalSensors' => (int) $sensor['total'],
        ];
    }
}
