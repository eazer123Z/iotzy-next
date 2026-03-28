<?php
require_once __DIR__ . '/../core/bootstrap.php';
require_once __DIR__ . '/../core/auth.php';

function handleAuthAction($action, $body, $db)
{

    if ($action === 'login') {
        $login = trim($body['username'] ?? $body['login'] ?? $body['email'] ?? '');
        $password = $body['password'] ?? $body['pass'] ?? '';
        $res = loginUser($login, $password);
        if ($res === true) {
            $csrfToken = generateCsrfToken();
            jsonOut([
                'success' => true,
                'message' => 'Login berhasil',
                'csrf_token' => $csrfToken,
                'redirect' => '' . APP_URL . '/'
            ]);
        }
        jsonOut(['success' => false, 'error' => $res]);
    }

    if ($action === 'register') {
        $username = trim($body['reg_username'] ?? $body['username'] ?? '');
        $email = trim($body['reg_email'] ?? $body['email'] ?? '');
        $password = $body['reg_password'] ?? $body['password'] ?? '';
        $fullname = trim($body['reg_fullname'] ?? $body['fullname'] ?? '');
        $res = registerUser($username, $email, $password, $fullname);
        if ($res === true) {
            jsonOut(['success' => true, 'redirect' => '' . APP_URL . '/?route=login']);
        }
        jsonOut(['success' => false, 'error' => $res]);
    }

    if ($action === 'logout') {
        requireCsrf();
        if (isLoggedIn()) {
            logoutUser();
            jsonOut(['success' => true, 'redirect' => '' . APP_URL . '/?route=login']);
        }
        jsonOut(['success' => false]);
    }
}