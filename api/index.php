<?php
/**
 * Single Entry Point for Vercel Serverless (Unified)
 * Path: api/index.php
 */

// ── CORS Headers ──────────────────────────────────────────────
$allowedOrigins = [
    getenv('FRONTEND_URL') ?: 'https://iotzy-next.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
else {
    header("Access-Control-Allow-Origin: *");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, Authorization');

// Handle preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
// ─────────────────────────────────────────────────────────────

try {
    require_once __DIR__ . '/../core/bootstrap.php';
    require_once __DIR__ . '/../core/auth.php';
    require_once __DIR__ . '/../core/UserDataService.php';
}
catch (Throwable $e) {
    header('Content-Type: application/json');
    die(json_encode(['success' => false, 'boot_error' => $e->getMessage()]));
}

if (function_exists('registerApiErrorHandler')) {
    registerApiErrorHandler();
}

// Parse Action — support GET, POST, dan JSON body
$action = null;
if (!empty($_GET['action'])) {
    $action = $_GET['action'];
}
elseif (!empty($_POST['action'])) {
    $action = $_POST['action'];
}
else {
    $rawInput = file_get_contents('php://input');
    if ($rawInput) {
        $decoded = json_decode($rawInput, true);
        if (isset($decoded['action']))
            $action = $decoded['action'];
    }
}

// Handle Auth Public Routes
if ($action === 'login' || $action === 'register') {
    $inputJSON = file_get_contents('php://input');
    $body = json_decode($inputJSON, true) ?: $_POST;
    require_once __DIR__ . '/../controllers/AuthController.php';
    handleAuthAction($action, $body, getLocalDB());
    exit;
}

// Logout
if ($action === 'logout') {
    logoutUser();
    jsonOut(['success' => true]);
    exit;
}

// ── API: semua action butuh login ──────────────────────────────
if ($action) {
    if (!isLoggedIn()) {
        jsonOut(['success' => false, 'error' => 'Unauthorized'], 401);
    }

    requireCsrf();
    $inputJSON = file_get_contents('php://input');
    $body = json_decode($inputJSON, true) ?: $_POST;
    $userId = (int)$_SESSION['user_id'];
    $db = getLocalDB();
    if (!$db)
        jsonOut(['success' => false, 'error' => 'Database unreachable.'], 500);

    $routes = [
        'get_devices' => 'DeviceController.php',
        'add_device' => 'DeviceController.php',
        'update_device' => 'DeviceController.php',
        'delete_device' => 'DeviceController.php',
        'update_device_state' => 'DeviceController.php',
        'get_sensors' => 'SensorController.php',
        'add_sensor' => 'SensorController.php',
        'update_sensor' => 'SensorController.php',
        'delete_sensor' => 'SensorController.php',
        'update_sensor_value' => 'SensorController.php',
        'get_sensor_readings' => 'SensorController.php',
        'get_automation_rules' => 'AutomationController.php',
        'add_automation_rule' => 'AutomationController.php',
        'update_automation_rule' => 'AutomationController.php',
        'delete_automation_rule' => 'AutomationController.php',
        'get_schedules' => 'AutomationController.php',
        'add_schedule' => 'AutomationController.php',
        'toggle_schedule' => 'AutomationController.php',
        'delete_schedule' => 'AutomationController.php',
        'get_cv_rules' => 'CVController.php',
        'save_cv_rules' => 'CVController.php',
        'get_cv_config' => 'CVController.php',
        'save_cv_config' => 'CVController.php',
        'get_settings' => 'SettingsController.php',
        'save_settings' => 'SettingsController.php',
        'get_mqtt_templates' => 'SettingsController.php',
        'get_logs' => 'LogController.php',
        'add_log' => 'LogController.php',
        'clear_logs' => 'LogController.php',
        'get_user' => 'ProfileController.php',
        'update_profile' => 'ProfileController.php',
        'change_password' => 'ProfileController.php',
        'ai_chat_process' => 'AIChatController.php',
        'delete_chat_history' => 'AIChatController.php',
        'get_ai_chat_history' => 'AIChatController.php',
        'test_telegram' => 'AIChatController.php',
        'db_status' => 'AIChatController.php',
        'get_dashboard_data' => 'DashboardController.php',
    ];

    if (isset($routes[$action])) {
        $file = $routes[$action];
        require_once __DIR__ . '/../controllers/' . $file;
        $handler = 'handle' . str_replace('Controller.php', 'Action', $file);
        if (function_exists($handler)) {
            $handler($action, $userId, $body, $db);
        }
        else {
            jsonOut(['success' => false, 'error' => "Handler '$handler' missing"], 500);
        }
    }
    else {
        jsonOut(['success' => false, 'error' => "Action '$action' unknown"], 400);
    }
    exit;
}

header('Content-Type: application/json');
jsonOut(['success' => false, 'error' => 'No action specified. Use React frontend.'], 400);