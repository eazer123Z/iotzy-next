<?php

declare(strict_types=1);

namespace App;

use PDO;

final class Database
{
    private PDO $pdo;

    public function __construct(Env $env)
    {
        $host = $env->get('DB_HOST', '127.0.0.1');
        $port = $env->get('DB_PORT', '3306');
        $name = $env->get('DB_NAME', 'iotzy_next');
        $user = $env->get('DB_USER', 'root');
        $pass = $env->get('DB_PASS', '');
        $charset = $env->get('DB_CHARSET', 'utf8mb4');

        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $host, $port, $name, $charset);

        $this->pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }

    public function pdo(): PDO
    {
        return $this->pdo;
    }
}
