<?php

namespace App\Support;

/**
 * URLs públicas para archivos en storage/app/public (enlace public/storage).
 * Usa rutas relativas para que funcionen con cualquier host/puerto (artisan serve, Vite, etc.).
 */
final class PublicStorage
{
    public static function url(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        return '/storage/'.ltrim(str_replace('\\', '/', $path), '/');
    }
}
