<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Sirve archivos de storage/app/public cuando el hosting bloquea public/storage (symlinks).
 */
class PublicStorageController extends Controller
{
    public function __invoke(Request $request, string $path): StreamedResponse
    {
        $path = str_replace('\\', '/', $path);

        if ($path === '' || str_contains($path, '..')) {
            abort(404);
        }

        $disk = Storage::disk('public');

        if (! $disk->exists($path)) {
            abort(404);
        }

        return $disk->response($path, null, [
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }
}
