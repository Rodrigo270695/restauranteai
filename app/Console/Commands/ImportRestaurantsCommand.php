<?php

namespace App\Console\Commands;

use App\Services\RestaurantImportService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class ImportRestaurantsCommand extends Command
{
    protected $signature = 'restaurants:import
                            {file? : Ruta al .xlsx o .csv (por defecto database/imports/restaurantes dataset.xlsx)}
                            {--owner=import@discoverlambo.com : Email del usuario dueño para los locales importados}
                            {--dry-run : Validar filas sin guardar en la base de datos}
                            {--strict : Detener al primer error}';

    protected $description = 'Importa restaurantes desde Excel o CSV (plantilla o dataset Lambayeque)';

    public function handle(RestaurantImportService $importer): int
    {
        $file = $this->argument('file')
            ?? base_path('database/imports/restaurantes dataset.xlsx');

        if (! File::isFile($file)) {
            $this->error("Archivo no encontrado: {$file}");
            $this->line('Uso: php artisan restaurants:import "database/imports/restaurantes dataset.xlsx"');

            return self::FAILURE;
        }

        $this->info('Archivo: '.$file);
        $this->line('Dueño: '.$this->option('owner'));

        if ($this->option('dry-run')) {
            $this->warn('Modo simulación (dry-run): no se guardará nada.');
        }

        $owner = $importer->resolveImportOwner($this->option('owner'));

        $stats = $importer->import(
            $file,
            $owner,
            dryRun: (bool) $this->option('dry-run'),
            skipErrors: ! $this->option('strict'),
        );

        $this->newLine();
        $this->table(
            ['Métrica', 'Cantidad'],
            [
                ['Creados', (string) $stats['created']],
                ['Actualizados', (string) $stats['updated']],
                ['Omitidos / validados', (string) $stats['skipped']],
                ['Errores', (string) count($stats['errors'])],
            ],
        );

        if ($stats['errors'] !== []) {
            $this->newLine();
            $this->warn('Errores (primeros 20):');
            foreach (array_slice($stats['errors'], 0, 20) as $error) {
                $this->line('  • '.$error);
            }
            if (count($stats['errors']) > 20) {
                $this->line('  … y '.(count($stats['errors']) - 20).' más');
            }
        }

        if (! $this->option('dry-run') && $stats['created'] + $stats['updated'] > 0) {
            $this->newLine();
            $this->info('Importación completada. Los locales están activos y verificados para el portal.');
        }

        return count($stats['errors']) > 0 && $this->option('strict')
            ? self::FAILURE
            : self::SUCCESS;
    }
}
