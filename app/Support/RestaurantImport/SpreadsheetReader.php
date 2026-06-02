<?php

namespace App\Support\RestaurantImport;

use PhpOffice\PhpSpreadsheet\IOFactory;
use RuntimeException;

final class SpreadsheetReader
{
    /**
     * @return list<array<string, mixed>>
     */
    public function read(string $path): array
    {
        if (! is_readable($path)) {
            throw new RuntimeException("No se puede leer el archivo: {$path}");
        }

        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        return match ($extension) {
            'csv' => $this->readCsv($path),
            'xlsx', 'xls' => $this->readExcel($path),
            default => throw new RuntimeException('Formato no soportado. Usa .csv, .xlsx o .xls'),
        };
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function readCsv(string $path): array
    {
        $handle = fopen($path, 'r');
        if ($handle === false) {
            throw new RuntimeException("No se pudo abrir CSV: {$path}");
        }

        $header = fgetcsv($handle);
        if ($header === false) {
            fclose($handle);

            return [];
        }

        $keys = $this->canonicalKeys($header);
        $rows = [];

        while (($data = fgetcsv($handle)) !== false) {
            $row = $this->combineRow($keys, $data);
            if ($this->rowHasName($row)) {
                $rows[] = $row;
            }
        }

        fclose($handle);

        return $rows;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function readExcel(string $path): array
    {
        $sheet = IOFactory::load($path)->getActiveSheet();
        $matrix = $sheet->toArray(null, true, true, false);

        if ($matrix === []) {
            return [];
        }

        $header = array_shift($matrix);
        $keys = $this->canonicalKeys($header);
        $rows = [];

        foreach ($matrix as $data) {
            $row = $this->combineRow($keys, $data);
            if ($this->rowHasName($row)) {
                $rows[] = $row;
            }
        }

        return $rows;
    }

    /**
     * @param  list<string|null>  $header
     * @return list<string|null>
     */
    private function canonicalKeys(array $header): array
    {
        return array_map(fn ($cell) => $this->canonicalKey($cell), $header);
    }

    /**
     * @param  list<string|null>  $keys
     * @param  list<mixed>  $values
     * @return array<string, mixed>
     */
    private function combineRow(array $keys, array $values): array
    {
        $row = [];
        foreach ($keys as $i => $key) {
            if ($key === null) {
                continue;
            }
            $row[$key] = $values[$i] ?? null;
        }

        return $row;
    }

    private function canonicalKey(?string $header): ?string
    {
        if ($header === null || trim($header) === '') {
            return null;
        }

        $normalized = strtolower(trim(preg_replace('/\s+/', ' ', $header) ?? $header));
        $ascii = str($normalized)->ascii()->toString();

        return match ($ascii) {
            'nombre', 'nombre del restaurante' => 'nombre',
            'especialidad_gastronomica', 'especialidad gastronomica' => 'especialidad',
            'categoria_establecimiento', 'categoria establecimiento', 'categoria del establecimiento' => 'categoria',
            'entorno_restaurante', 'entorno restaurante', 'entorno del restaurante' => 'entorno',
            'ambiente_restaurante', 'ambiente restaurante', 'ambiente del restaurante' => 'ambiente',
            'rango_precios', 'rango precios', 'rango de precios' => 'precio',
            'momento_recomendado', 'momento recomendado' => 'momento',
            'servicios', 'servicios ofrecidos' => 'servicios',
            'ubicacion', 'ubicacion distrito' => 'ubicacion',
            'departamento' => 'departamento',
            'provincia' => 'provincia',
            'distrito' => 'distrito',
            'publico_objetivo', 'publico objetivo' => 'publico',
            'dias', 'dias apertura', 'dias de apertura' => 'dias',
            'hora_apertura', 'hora apertura', 'hora de apertura' => 'hora_apertura',
            'hora_cierre', 'hora cierre', 'hora de cierre' => 'hora_cierre',
            'direccion', 'direccion completa' => 'direccion',
            'latitud', 'lat' => 'latitud',
            'longitud', 'lng', 'lon' => 'longitud',
            'descripcion_corta', 'descripcion corta', 'descripcion' => 'descripcion',
            'telefono', 'teléfono', 'telefono contacto' => 'telefono',
            default => null,
        };
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function rowHasName(array $row): bool
    {
        $name = trim((string) ($row['nombre'] ?? ''));

        return $name !== '' && strtolower($name) !== 'nombre';
    }
}
