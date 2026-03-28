<?php
/**
 * controllers/DeviceController.php
 * FIXED:
 * - Race condition: activity log inside transaction
 * - Removed duplicate requireCsrf() (handled in api/index.php)
 * - Added bulk_device_control action
 * - Added cleanup_sessions action for orphaned device sessions
 */

require_once __DIR__ . '/../core/bootstrap.php';
require_once __DIR__ . '/../core/UserDataService.php';

function handleDeviceAction($action, $userId, $body, $db)
{
    if ($action === 'get_devices')
        jsonOut(getUserDevices($userId));

    if ($action === 'add_device') {
        $name = sanitizeInput($body['name'] ?? '', 100);
        $icon = sanitizeInput($body['icon'] ?? 'fa-plug', 50);
        $sub = sanitizeInput($body['topic_sub'] ?? '', 200);
        $pub = sanitizeInput($body['topic_pub'] ?? '', 200);
        if (!$name)
            jsonOut(['error' => 'Nama perangkat tidak boleh kosong']);
        $allowedIcons = ['fa-lightbulb', 'fa-wind', 'fa-snowflake', 'fa-tv', 'fa-lock', 'fa-door-open', 'fa-video', 'fa-volume-up', 'fa-plug'];
        $icon = validateEnum($icon, $allowedIcons, 'fa-plug');
        $key = 'device_' . bin2hex(random_bytes(8));
        $newId = dbInsert("INSERT INTO devices (user_id,device_key,name,icon,type,topic_sub,topic_pub) VALUES (?,?,?,?,?,?,?)", [$userId, $key, $name, $icon, 'switch', $sub, $pub]);
        addActivityLog($userId, $name, 'Perangkat baru ditambahkan', 'User', 'success');
        jsonOut(['success' => true, 'id' => $newId, 'device_key' => $key, 'message' => 'Perangkat berhasil ditambahkan']);
    }

    if ($action === 'update_device') {
        $devId = (int)($body['id'] ?? 0);
        $name = sanitizeInput($body['name'] ?? '', 100);
        $icon = sanitizeInput($body['icon'] ?? 'fa-plug', 50);
        $sub = sanitizeInput($body['topic_sub'] ?? '', 200);
        $pub = sanitizeInput($body['topic_pub'] ?? '', 200);
        if (!$devId || !$name)
            jsonOut(['success' => false, 'error' => 'ID atau Nama perangkat tidak valid']);
        $stmt = $db->prepare("SELECT id FROM devices WHERE id=? AND user_id=?");
        $stmt->execute([$devId, $userId]);
        if (!$stmt->fetch())
            jsonOut(['success' => false, 'error' => 'Akses ditolak atau perangkat tidak ditemukan']);
        $allowedIcons = ['fa-lightbulb', 'fa-wind', 'fa-snowflake', 'fa-tv', 'fa-lock', 'fa-door-open', 'fa-video', 'fa-volume-up', 'fa-plug'];
        $icon = validateEnum($icon, $allowedIcons, 'fa-plug');
        dbWrite("UPDATE devices SET name=?,icon=?,topic_sub=?,topic_pub=? WHERE id=? AND user_id=?", [$name, $icon, $sub, $pub, $devId, $userId]);
        addActivityLog($userId, $name, 'Konfigurasi perangkat diperbarui', 'User', 'info');
        jsonOut(['success' => true, 'message' => 'Data perangkat berhasil diperbarui']);
    }

    if ($action === 'delete_device') {
        $devId = (int)($body['id'] ?? 0);
        $stmt = $db->prepare("SELECT name FROM devices WHERE id=? AND user_id=?");
        $stmt->execute([$devId, $userId]);
        $dev = $stmt->fetch();
        if ($dev) {
            dbWrite("DELETE FROM devices WHERE id=? AND user_id=?", [$devId, $userId]);
            addActivityLog($userId, $dev['name'], 'Perangkat telah dihapus dari sistem', 'User', 'warning');
        }
        jsonOut(['success' => true, 'message' => 'Perangkat berhasil dihapus']);
    }

    if ($action === 'update_device_state') {
        $devId = (int)($body['id'] ?? 0);
        $newState = isset($body['state']) ? (int)(bool)$body['state'] : 0;
        $trigger = validateEnum($body['trigger'] ?? 'Manual', ['Manual', 'Automation', 'Schedule', 'CV', 'System', 'MQTT', 'AI'], 'Manual');

        try {
            $db->beginTransaction();
            $stmt = $db->prepare("SELECT id,name,last_state FROM devices WHERE id=? AND user_id=? FOR UPDATE");
            $stmt->execute([$devId, $userId]);
            $dev = $stmt->fetch();
            if (!$dev) {
                $db->rollBack();
                jsonOut(['success' => false, 'error' => 'Perangkat tidak ditemukan']);
            }
            $prevState = (int)$dev['last_state'];

            dbWrite("UPDATE devices SET last_state=?,latest_state=?,last_seen=NOW(),last_state_changed=NOW() WHERE id=?", [$newState, $newState, $devId]);

            if ($newState === 1 && $prevState === 0) {
                dbInsert("INSERT INTO device_sessions (user_id,device_id,turned_on_at,trigger_type) VALUES (?,?,NOW(),?)", [$userId, $devId, $trigger]);
            }
            elseif ($newState === 0 && $prevState === 1) {
                $s2 = $db->prepare("SELECT id,turned_on_at FROM device_sessions WHERE device_id=? AND turned_off_at IS NULL ORDER BY turned_on_at DESC LIMIT 1");
                $s2->execute([$devId]);
                $sess = $s2->fetch();
                if ($sess) {
                    $duration = max(0, (int)(time() - strtotime($sess['turned_on_at'])));
                    dbWrite("UPDATE device_sessions SET turned_off_at=NOW(),duration_seconds=? WHERE id=?", [$duration, $sess['id']]);
                }
            }

            // FIXED: Activity log inside transaction
            $db->prepare("INSERT INTO activity_logs (user_id, device_name, activity, trigger_type, log_type) VALUES (?, ?, ?, ?, ?)")
                ->execute([$userId, $dev['name'], $newState ? 'Dinyalakan (ON)' : 'Dimatikan (OFF)', $trigger, 'info']);

            $db->commit();
        }
        catch (PDOException $e) {
            if ($db->inTransaction())
                $db->rollBack();
            error_log('[IoTzy] update_device_state: ' . $e->getMessage());
            jsonOut(['success' => false, 'error' => 'Gagal memperbarui status']);
        }

        jsonOut(['success' => true, 'newState' => $newState]);
    }

    if ($action === 'get_device_sessions') {
        $devId = (int)($_GET['device_id'] ?? 0);
        $limit = max(1, min((int)($_GET['limit'] ?? 20), 200));
        if ($devId) {
            $stmt = $db->prepare("SELECT ds.* FROM device_sessions ds JOIN devices d ON d.id=ds.device_id WHERE ds.device_id=? AND d.user_id=? ORDER BY ds.turned_on_at DESC LIMIT ?");
            $stmt->execute([$devId, $userId, $limit]);
        }
        else {
            $stmt = $db->prepare("SELECT ds.*,d.name AS device_name FROM device_sessions ds JOIN devices d ON d.id=ds.device_id WHERE d.user_id=? ORDER BY ds.turned_on_at DESC LIMIT ?");
            $stmt->execute([$userId, $limit]);
        }
        jsonOut($stmt->fetchAll());
    }

    // NEW: Bulk device control
    if ($action === 'bulk_device_control') {
        $deviceIds = $body['device_ids'] ?? [];
        $newState = isset($body['state']) ? (int)(bool)$body['state'] : 0;
        $trigger = 'Manual';

        if (empty($deviceIds) || !is_array($deviceIds)) {
            jsonOut(['success' => false, 'error' => 'Tidak ada perangkat yang dipilih']);
        }

        $results = [];
        foreach ($deviceIds as $devId) {
            $devId = (int)$devId;
            $stmt = $db->prepare("SELECT id, name, last_state FROM devices WHERE id=? AND user_id=? AND is_active=1");
            $stmt->execute([$devId, $userId]);
            $dev = $stmt->fetch();
            if (!$dev)
                continue;

            $prevState = (int)$dev['last_state'];
            if ($prevState === $newState)
                continue; // skip if already in desired state

            dbWrite("UPDATE devices SET last_state=?,latest_state=?,last_seen=NOW(),last_state_changed=NOW() WHERE id=?", [$newState, $newState, $devId]);

            if ($newState === 1) {
                dbInsert("INSERT INTO device_sessions (user_id,device_id,turned_on_at,trigger_type) VALUES (?,?,NOW(),?)", [$userId, $devId, $trigger]);
            }
            else {
                $s2 = $db->prepare("SELECT id,turned_on_at FROM device_sessions WHERE device_id=? AND turned_off_at IS NULL ORDER BY turned_on_at DESC LIMIT 1");
                $s2->execute([$devId]);
                $sess = $s2->fetch();
                if ($sess) {
                    $duration = max(0, (int)(time() - strtotime($sess['turned_on_at'])));
                    dbWrite("UPDATE device_sessions SET turned_off_at=NOW(),duration_seconds=? WHERE id=?", [$duration, $sess['id']]);
                }
            }

            addActivityLog($userId, $dev['name'], $newState ? 'Bulk ON' : 'Bulk OFF', 'User', 'info');
            $results[] = ['id' => $devId, 'name' => $dev['name'], 'newState' => $newState];
        }

        jsonOut(['success' => true, 'updated' => $results, 'count' => count($results)]);
    }

    // NEW: Cleanup orphaned device sessions
    if ($action === 'cleanup_sessions') {
        $maxHours = max(1, min((int)($body['max_hours'] ?? 24), 168)); // 1h to 7 days
        $stmt = $db->prepare(
            "UPDATE device_sessions SET turned_off_at=NOW(), duration_seconds=TIMESTAMPDIFF(SECOND, turned_on_at, NOW()) 
             WHERE user_id=? AND turned_off_at IS NULL AND turned_on_at < DATE_SUB(NOW(), INTERVAL ? HOUR)"
        );
        $stmt->execute([$userId, $maxHours]);
        $cleaned = $stmt->rowCount();

        if ($cleaned > 0) {
            addActivityLog($userId, 'System', "$cleaned sesi perangkat orphan dibersihkan", 'System', 'warning');
        }

        jsonOut(['success' => true, 'cleaned' => $cleaned]);
    }
}
