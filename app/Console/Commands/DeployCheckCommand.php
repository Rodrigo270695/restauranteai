<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

class DeployCheckCommand extends Command
{
    protected $signature = 'app:deploy-check';

    protected $description = 'Verifica que el código y rutas de galería desplegados coinciden con lo esperado';

    public function handle(): int
    {
        $this->info('=== Verificación de despliegue ===');

        $gitHead = base_path('.git/HEAD');
        if (File::exists($gitHead)) {
            $ref = trim(File::get($gitHead));
            if (str_starts_with($ref, 'ref:')) {
                $refPath = base_path('.git/'.trim(substr($ref, 5)));
                $commit = File::exists($refPath) ? substr(trim(File::get($refPath)), 0, 7) : '?';
                $this->line("Git commit: {$commit}");
            } else {
                $this->line('Git commit: '.substr($ref, 0, 7));
            }
        } else {
            $this->warn('Sin .git (commit no disponible)');
        }

        $controllerPath = app_path('Http/Controllers/App/GalleryController.php');
        $controller = File::get($controllerPath);

        $checks = [
            'updateGalleryImage' => str_contains($controller, 'function updateGalleryImage'),
            'gallery.destroy.post route file' => str_contains(File::get(base_path('routes/web.php')), "->name('gallery.destroy.post')"),
            'gallery.unlink route file' => str_contains(File::get(base_path('routes/web.php')), 'gallery/{image}/unlink'),
            'gallery.update.post route file' => str_contains(File::get(base_path('routes/web.php')), 'gallery/{image}/update'),
        ];

        $jsChecksOk = true;

        foreach ($checks as $label => $ok) {
            $this->line(($ok ? '✔' : '✘')." {$label}");
        }

        $routes = collect(Route::getRoutes())->filter(
            fn ($route) => str_contains((string) $route->getName(), 'gallery')
        );

        $this->newLine();
        $this->info('Rutas gallery activas:');
        foreach ($routes as $route) {
            $this->line(sprintf(
                '  %s %s → %s',
                implode('|', $route->methods()),
                $route->uri(),
                $route->getActionName(),
            ));
        }

        $buildManifest = public_path('build/manifest.json');
        if (File::exists($buildManifest)) {
            $mtime = date('Y-m-d H:i:s', File::lastModified($buildManifest));
            $this->newLine();
            $this->line("Build manifest: {$mtime}");

            $manifest = json_decode(File::get($buildManifest), true);
            $galleryEntry = $manifest['resources/js/pages/app/gallery/index.tsx']['file'] ?? null;
            $galleryJs = $galleryEntry ? public_path('build/'.$galleryEntry) : null;

            if ($galleryJs && File::exists($galleryJs)) {
                $js = File::get($galleryJs);
                $hasDetach = str_contains($js, '/detach');
                $hasUpdatePost = str_contains($js, '/update');
                $hasMethodDelete = str_contains($js, '_method') && str_contains($js, 'delete');
                $this->line('JS galería: '.basename($galleryJs));
                $this->line('  → usa /detach: '.($hasDetach ? 'sí' : 'no'));
                $this->line('  → usa /update: '.($hasUpdatePost ? 'sí' : 'no'));
                $this->line('  → contiene _method+delete: '.($hasMethodDelete ? 'sí' : 'no'));
                if (! $hasDetach || ! $hasUpdatePost) {
                    $jsChecksOk = false;
                }
            } else {
                $this->warn('No se encontró el chunk JS de galería en el manifest.');
                $jsChecksOk = false;
            }
        } else {
            $this->warn('public/build/manifest.json no existe');
            $jsChecksOk = false;
        }

        $failed = in_array(false, $checks, true) || ! $jsChecksOk;

        return $failed ? self::FAILURE : self::SUCCESS;
    }
}
