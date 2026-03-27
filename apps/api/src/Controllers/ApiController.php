<?php

declare(strict_types=1);

namespace App\Controllers;

use App\DashboardRepository;
use App\ModuleRepository;

final class ApiController
{
    public function __construct(
        private DashboardRepository $dashboardRepo,
        private ModuleRepository $moduleRepo,
    ) {
    }

    /** @return array<string, mixed> */
    public function health(): array
    {
        return [
            'status' => 'ok',
            'service' => 'iotzy-php-api',
            'time' => gmdate(DATE_ATOM),
        ];
    }

    /** @return array<string, mixed> */
    public function menu(): array
    {
        return [
            'items' => [
                ['key' => 'dashboard', 'label' => 'Dashboard', 'endpoint' => '/api/dashboard'],
                ['key' => 'devices', 'label' => 'Devices', 'endpoint' => '/api/devices'],
                ['key' => 'sensors', 'label' => 'Sensors', 'endpoint' => '/api/sensors'],
                ['key' => 'automation', 'label' => 'Automation', 'endpoint' => '/api/automation'],
                ['key' => 'settings', 'label' => 'Settings', 'endpoint' => '/api/settings'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    public function dashboard(int $userId): array
    {
        return ['userId' => $userId, 'stats' => $this->dashboardRepo->stats($userId), 'source' => 'php-native'];
    }

    /** @return array<string, mixed> */
    public function devices(int $userId): array
    {
        return ['userId' => $userId, 'items' => $this->moduleRepo->devices($userId)];
    }

    /** @return array<string, mixed> */
    public function sensors(int $userId): array
    {
        return ['userId' => $userId, 'items' => $this->moduleRepo->sensors($userId)];
    }

    /** @return array<string, mixed> */
    public function automation(int $userId): array
    {
        return ['userId' => $userId, 'items' => $this->moduleRepo->automation($userId)];
    }

    /** @return array<string, mixed> */
    public function settings(int $userId): array
    {
        return ['userId' => $userId, 'item' => $this->moduleRepo->settings($userId)];
    }

    /** @return array<string, mixed> */
    public function bootstrap(int $userId): array
    {
        return [
            'userId' => $userId,
            'dashboard' => $this->dashboardRepo->stats($userId),
            'devices' => $this->moduleRepo->devices($userId),
            'sensors' => $this->moduleRepo->sensors($userId),
            'automation' => $this->moduleRepo->automation($userId),
            'settings' => $this->moduleRepo->settings($userId),
        ];
    }
}
