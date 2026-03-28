<?php
/**
 * core/UserDataService.php
 * FIXED:
 * - getCurrentUser() static cache can be invalidated
 * - Added getCurrentUserFresh() for post-update scenarios
 * - Better error handling
 */

require_once __DIR__ . '/bootstrap.php';

function getCurrentUser($fresh = false)
{
    static $c = null;
    if ($c !== null && !$fresh)
        return $c;

    if (session_status() !== PHP_SESSION_ACTIVE && function_exists('startSecureSession'))
        startSecureSession();
    if (empty($_SESSION['user_id']))
        return null;
    $db = getLocalDB();
    if (!$db)
        return null;
    try {
        $st = $db->prepare("SELECT u.id, u.username, u.email, u.full_name, u.role, u.is_active, 
            COALESCE(s.theme, 'dark') AS theme 
            FROM users u LEFT JOIN user_settings s ON s.user_id = u.id 
            WHERE u.id = ? AND u.is_active = 1 LIMIT 1");
        $st->execute([$_SESSION['user_id']]);
        $c = $st->fetch() ?: null;
        return $c;
    }
    catch (PDOException $e) {
        error_log('[IoTzy] getCurrentUser error: ' . $e->getMessage());
        return null;
    }
}

function getCurrentUserFresh()
{
    return getCurrentUser(true);
}

function getUserDevices($userId)
{
    $db = getLocalDB();
    if (!$db)
        return [];
    try {
        $st = $db->prepare("SELECT id, user_id, device_key, name, icon, type, topic_sub, topic_pub, is_active, last_state, latest_state, last_seen 
            FROM devices WHERE user_id = ? AND is_active = TRUE ORDER BY created_at ASC");
        $st->execute([$userId]);
        return $st->fetchAll();
    }
    catch (PDOException $e) {
        return [];
    }
}

function getAllUserDevices($userId)
{
    $db = getLocalDB();
    if (!$db)
        return [];
    try {
        $st = $db->prepare("SELECT id, user_id, device_key, name, icon, type, topic_sub, topic_pub, is_active, last_state, latest_state, last_seen 
            FROM devices WHERE user_id = ? ORDER BY created_at ASC");
        $st->execute([$userId]);
        return $st->fetchAll();
    }
    catch (PDOException $e) {
        return [];
    }
}

function getUserSensors($userId)
{
    $db = getLocalDB();
    if (!$db)
        return [];
    try {
        $st = $db->prepare("SELECT id, user_id, sensor_key, name, type, icon, unit, topic, latest_value, last_seen 
            FROM sensors WHERE user_id = ? ORDER BY created_at ASC");
        $st->execute([$userId]);
        return $st->fetchAll();
    }
    catch (PDOException $e) {
        return [];
    }
}

function getUserSettings($userId)
{
    $db = getLocalDB();
    if (!$db)
        return null;
    try {
        $st = $db->prepare("SELECT * FROM user_settings WHERE user_id = ? LIMIT 1");
        $st->execute([$userId]);
        $row = $st->fetch();
        if (!$row) {
            return [
                'user_id' => $userId,
                'mqtt_broker' => getenv('MQTT_HOST') ?: 'broker.hivemq.com',
                'mqtt_port' => (int)(getenv('MQTT_PORT') ?: 8884),
                'mqtt_use_ssl' => (getenv('MQTT_USE_SSL') === 'true' || getenv('MQTT_USE_SSL') === '1') ? 1 : 0,
                'mqtt_path' => getenv('MQTT_PATH') ?: '/mqtt',
                'theme' => 'dark',
                'quick_control_devices' => [],
                'cv_config' => [],
                'cv_rules' => []
            ];
        }
        $row['quick_control_devices'] = !empty($row['quick_control_devices']) ? (json_decode($row['quick_control_devices'], true) ?? []) : [];
        if (!empty($row['cv_config']))
            $row['cv_config'] = json_decode($row['cv_config'], true) ?? [];
        if (!empty($row['cv_rules']))
            $row['cv_rules'] = json_decode($row['cv_rules'], true) ?? [];
        unset($row['mqtt_password_enc']);
        return $row;
    }
    catch (PDOException $e) {
        return null;
    }
}

function addActivityLog($userId, $deviceName, $activity, $triggerType = 'System', $logType = 'info')
{
    $db = getLocalDB();
    if (!$db)
        return;
    $allowed = ['info', 'success', 'warning', 'error'];
    if (!in_array($logType, $allowed, true))
        $logType = 'info';
    try {
        $db->prepare("INSERT INTO activity_logs (user_id, device_name, activity, trigger_type, log_type) VALUES (?, ?, ?, ?, ?)")
            ->execute([$userId, mb_substr($deviceName, 0, 100), mb_substr($activity, 0, 200), mb_substr($triggerType, 0, 50), $logType]);
    }
    catch (PDOException $e) {
        error_log('[IoTzy] addActivityLog error: ' . $e->getMessage());
    }
}
