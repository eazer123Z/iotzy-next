<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/Env.php';
require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/DashboardRepository.php';
require_once __DIR__ . '/../src/ModuleRepository.php';

use App\Database;
use App\DashboardRepository;
use App\Env;
use App\ModuleRepository;

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$env = Env::load(__DIR__ . '/../.env');
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

try {
    if ($path === '/api/health') {
        echo json_encode([
            'status' => 'ok',
            'service' => 'iotzy-php-api',
            'time' => gmdate(DATE_ATOM),
        ], JSON_THROW_ON_ERROR);
        exit;
    }

    if ($path === '/api/menu') {
        echo json_encode([
            'items' => [
                ['key' => 'dashboard', 'label' => 'Dashboard', 'endpoint' => '/api/dashboard'],
                ['key' => 'devices', 'label' => 'Devices', 'endpoint' => '/api/devices'],
                ['key' => 'sensors', 'label' => 'Sensors', 'endpoint' => '/api/sensors'],
                ['key' => 'automation', 'label' => 'Automation', 'endpoint' => '/api/automation'],
                ['key' => 'settings', 'label' => 'Settings', 'endpoint' => '/api/settings'],
            ],
        ], JSON_THROW_ON_ERROR);
        exit;
    }

    $userId = (int) ($_GET['userId'] ?? 1);
    $db = new Database($env);
    $dashboardRepo = new DashboardRepository($db->pdo());
    $moduleRepo = new ModuleRepository($db->pdo());

    if ($path === '/api/dashboard') {
        echo json_encode([
            'userId' => $userId,
            'stats' => $dashboardRepo->stats($userId),
            'source' => 'php-native',
        ], JSON_THROW_ON_ERROR);
        exit;
    }

    if ($path === '/api/devices') {
        echo json_encode(['userId' => $userId, 'items' => $moduleRepo->devices($userId)], JSON_THROW_ON_ERROR);
        exit;
    }

    if ($path === '/api/sensors') {
        echo json_encode(['userId' => $userId, 'items' => $moduleRepo->sensors($userId)], JSON_THROW_ON_ERROR);
        exit;
    }

    if ($path === '/api/automation') {
        echo json_encode(['userId' => $userId, 'items' => $moduleRepo->automation($userId)], JSON_THROW_ON_ERROR);
        exit;
    }

    if ($path === '/api/settings') {
        echo json_encode(['userId' => $userId, 'item' => $moduleRepo->settings($userId)], JSON_THROW_ON_ERROR);
        exit;
    }

    if ($path === '/api/bootstrap') {
        echo json_encode([
            'userId' => $userId,
            'dashboard' => $dashboardRepo->stats($userId),
            'devices' => $moduleRepo->devices($userId),
            'sensors' => $moduleRepo->sensors($userId),
            'automation' => $moduleRepo->automation($userId),
            'settings' => $moduleRepo->settings($userId),
        ], JSON_THROW_ON_ERROR);
        exit;
    }

    http_response_code(404);
    echo json_encode(['error' => 'Not Found'], JSON_THROW_ON_ERROR);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal Server Error',
        'message' => $env->get('APP_DEBUG', 'false') === 'true' ? $e->getMessage() : 'Unexpected error',
    ], JSON_THROW_ON_ERROR);
}
