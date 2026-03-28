<?php

function encryptSecret(string $plainText): ?string
{
    $plainText = trim($plainText);
    if ($plainText === '')
        return null;
    $key = hash_hkdf('sha256', APP_SECRET, 32, 'iotzy-encryption');
    $iv = random_bytes(16);
    $enc = openssl_encrypt($plainText, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
    return $enc === false ? null : base64_encode($iv . $enc);
}

function decryptSecret(?string $cipherText): string
{
    if (!$cipherText)
        return '';
    $raw = base64_decode($cipherText, true);
    if ($raw === false || strlen($raw) <= 16)
        return '';
    $key = hash_hkdf('sha256', APP_SECRET, 32, 'iotzy-encryption');
    $iv = substr($raw, 0, 16);
    $enc = substr($raw, 16);
    return openssl_decrypt($enc, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv) ?: '';
}

function jsonOut($data, $code = 200)
{
    if ($code !== 200)
        http_response_code($code);
    while (ob_get_level() > 0)
        ob_end_clean();
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

function registerApiErrorHandler()
{
    register_shutdown_function(function () {
        $err = error_get_last();
        if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
            while (ob_get_level() > 0)
                ob_end_clean();
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
            'success' => false,
            'error' => 'Critical System Failure: ' . $err['message']
            ]);
            error_log('[IoTzy FATAL] ' . $err['message'] . ' in ' . $err['file'] . ':' . $err['line']);
        }
    });
}

/**
 * Sanitize string input - trim and limit length
 */
function sanitizeInput(string $input, int $maxLength = 255): string
{
    return mb_substr(trim($input), 0, $maxLength);
}

/**
 * Validate that a value is in an allowed list
 */
function validateEnum(string $value, array $allowed, string $default): string
{
    return in_array($value, $allowed, true) ? $value : $default;
}
