<?php

declare(strict_types=1);

namespace App\Http;

use Closure;

final class Router
{
    /** @var array<string, Closure> */
    private array $getRoutes = [];

    public function get(string $path, Closure $handler): void
    {
        $this->getRoutes[$path] = $handler;
    }

    public function dispatch(string $method, string $path): bool
    {
        if ($method !== 'GET') {
            return false;
        }

        if (!isset($this->getRoutes[$path])) {
            return false;
        }

        ($this->getRoutes[$path])();
        return true;
    }
}
