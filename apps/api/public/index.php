<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/Env.php';
require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/DashboardRepository.php';
require_once __DIR__ . '/../src/ModuleRepository.php';
require_once __DIR__ . '/../src/Http/Response.php';
require_once __DIR__ . '/../src/Http/Router.php';
require_once __DIR__ . '/../src/Controllers/ApiController.php';

use App\Controllers\ApiController;
use App\DashboardRepository;
use App\Database;
use App\Env;
use App\Http\Response;
use App\Http\Router;
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
$userId = (int) ($_GET['userId'] ?? 1);

try {
    $db = new Database($env);
    $controller = new ApiController(
        new DashboardRepository($db->pdo()),
        new ModuleRepository($db->pdo())
    );

    $router = new Router();

    $router->get('/api/health', function () use ($controller): void {
        Response::json($controller->health());
    });

    $router->get('/api/menu', function () use ($controller): void {
        Response::json($controller->menu());
    });

    $router->get('/api/dashboard', function () use ($controller, $userId): void {
        Response::json($controller->dashboard($userId));
    });

    $router->get('/api/devices', function () use ($controller, $userId): void {
        Response::json($controller->devices($userId));
    });

    $router->get('/api/sensors', function () use ($controller, $userId): void {
        Response::json($controller->sensors($userId));
    });

    $router->get('/api/automation', function () use ($controller, $userId): void {
        Response::json($controller->automation($userId));
    });

    $router->get('/api/settings', function () use ($controller, $userId): void {
        Response::json($controller->settings($userId));
    });

    $router->get('/api/bootstrap', function () use ($controller, $userId): void {
        Response::json($controller->bootstrap($userId));
    });

    if (!$router->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', $path)) {
        Response::json(['error' => 'Not Found'], 404);
    }
} catch (Throwable $e) {
    Response::json([
        'error' => 'Internal Server Error',
        'message' => $env->get('APP_DEBUG', 'false') === 'true' ? $e->getMessage() : 'Unexpected error',
    ], 500);
}
