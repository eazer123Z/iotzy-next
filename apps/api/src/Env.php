<?php

declare(strict_types=1);

namespace App;

final class Env
{
    /** @var array<string, string> */
    private array $items = [];

    public static function load(string $path): self
    {
        $env = new self();

        if (!is_file($path)) {
            return $env;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            [$key, $value] = array_pad(explode('=', $line, 2), 2, '');
            $key = trim($key);
            $value = trim($value, " \t\n\r\0\x0B\"");

            if ($key !== '') {
                $env->items[$key] = $value;
                $_ENV[$key] = $value;
            }
        }

        return $env;
    }

    public function get(string $key, string $default = ''): string
    {
        return $_ENV[$key] ?? $this->items[$key] ?? $default;
    }
}
