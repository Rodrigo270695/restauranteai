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
            'mutateGalleryImage' => str_contains($controller, 'function mutateGalleryImage'),
            'wantsDelete' => str_contains($controller, 'function wantsDelete'),
            'gallery.unlink route file' => str_contains(File::get(base_path('routes/web.php')), 'gallery/{image}/unlink'),
        ];

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

            $galleryJs = collect(File::glob(public_path('build/assets/gallery-*.js')))->first();
            if ($galleryJs) {
                $js = File::get($galleryJs);
                $hasUnlink = str_contains($js, 'unlink');
                $hasMethodDelete = str_contains($js, '_method') && str_contains($js, 'delete');
                $this->line('JS galería: '.basename($galleryJs));
                $this->line('  → contiene "unlink": '.($hasUnlink ? 'sí' : 'no'));
                $this->line('  → contiene _method+delete: '.($hasMethodDelete ? 'sí' : 'no'));
            }
        } else {
            $this->warn('public/build/manifest.json no existe');
        }

        $failed = in_array(false, $checks, true);

        return $failed ? self::FAILURE : self::SUCCESS;
    }
}
