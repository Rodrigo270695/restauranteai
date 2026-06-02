<?php

namespace App\Services;

use App\Models\Ambiance;
use App\Models\CuisineType;
use App\Models\District;
use App\Models\PartyType;
use App\Models\RecommendedMoment;
use App\Models\Restaurant;
use App\Models\RestaurantEnvironment;
use App\Models\RestaurantProfile;
use App\Models\RestaurantSchedule;
use App\Models\Service;
use App\Models\User;
use App\Support\RestaurantImport\DistrictResolver;
use App\Support\RestaurantImport\SpreadsheetReader;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use RuntimeException;

class RestaurantImportService
{
    public function __construct(
        private readonly SpreadsheetReader $reader,
        private readonly DistrictResolver $districts,
        private readonly RestaurantCuisineService $cuisines,
    ) {}

    /**
     * @return array{created: int, updated: int, skipped: int, errors: list<string>}
     */
    public function import(string $path, User $owner, bool $dryRun = false, bool $skipErrors = true): array
    {
        $rows = $this->reader->read($path);
        $stats = ['created' => 0, 'updated' => 0, 'skipped' => 0, 'errors' => []];

        $fallbackDistrict = District::query()->where('name', 'Chiclayo')->first();

        foreach ($rows as $index => $row) {
            $line = $index + 2;

            try {
                $result = $dryRun
                    ? $this->validateRow($row, $line, $fallbackDistrict)
                    : $this->importRow($row, $owner, $fallbackDistrict);

                if ($result === 'created') {
                    $stats['created']++;
                } elseif ($result === 'updated') {
                    $stats['updated']++;
                } else {
                    $stats['skipped']++;
                }
            } catch (\Throwable $e) {
                $message = "Fila {$line}: {$e->getMessage()}";
                $stats['errors'][] = $message;
                if (! $skipErrors) {
                    throw new RuntimeException($message, 0, $e);
                }
            }
        }

        return $stats;
    }

    public function resolveImportOwner(string $email): User
    {
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => 'Importación DiscoverLambo',
                'password' => Hash::make(Str::random(32)),
                'email_verified_at' => now(),
            ],
        );

        if (! $user->hasRole('restaurant_owner')) {
            $user->assignRole('restaurant_owner');
        }

        RestaurantProfile::firstOrCreate(
            ['user_id' => $user->id],
            [
                'business_name' => 'Locales importados (dataset)',
                'status' => 'approved',
                'approved_at' => now(),
                'post_approval_completed_at' => now(),
            ],
        );

        return $user;
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function validateRow(array $row, int $line, ?District $fallbackDistrict): string
    {
        $name = trim((string) ($row['nombre'] ?? ''));
        if ($name === '') {
            throw new RuntimeException('Falta nombre');
        }

        $district = $this->districts->resolve(
            $this->stringOrNull($row['distrito'] ?? null),
            $this->stringOrNull($row['provincia'] ?? null),
            $this->stringOrNull($row['ubicacion'] ?? null),
        ) ?? $fallbackDistrict;

        if (! $district) {
            throw new RuntimeException('Distrito no encontrado: '.($row['distrito'] ?? $row['ubicacion'] ?? '?'));
        }

        return 'created';
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function importRow(array $row, User $owner, ?District $fallbackDistrict): string
    {
        return DB::transaction(function () use ($row, $owner, $fallbackDistrict) {
            $name = trim((string) ($row['nombre'] ?? ''));
            $district = $this->districts->resolve(
                $this->stringOrNull($row['distrito'] ?? null),
                $this->stringOrNull($row['provincia'] ?? null),
                $this->stringOrNull($row['ubicacion'] ?? null),
            ) ?? $fallbackDistrict;

            if (! $district) {
                throw new RuntimeException('Distrito no encontrado');
            }

            $priceRange = $this->normalizePriceRange($row['precio'] ?? null);
            $ambiance = $this->resolveAmbiance($this->splitPipe($row['ambiente'] ?? null)[0] ?? null);

            $existing = Restaurant::query()
                ->where('name', $name)
                ->where('district_id', $district->id)
                ->first();

            $slug = $existing?->slug ?? $this->uniqueSlug($name);

            $wasExisting = $existing !== null;

            $restaurant = Restaurant::updateOrCreate(
                ['slug' => $slug],
                [
                    'owner_id' => $owner->id,
                    'district_id' => $district->id,
                    'ambiance_id' => $ambiance?->id,
                    'name' => $name,
                    'short_description' => $this->truncate($this->stringOrNull($row['descripcion'] ?? null), 255),
                    'description' => $this->stringOrNull($row['categoria'] ?? null),
                    'address' => $this->truncate($this->stringOrNull($row['direccion'] ?? null), 255),
                    'latitude' => $this->normalizeCoordinate($row['latitud'] ?? null),
                    'longitude' => $this->normalizeCoordinate($row['longitud'] ?? null),
                    'phone' => $this->truncate($this->stringOrNull($row['telefono'] ?? null), 20),
                    'price_range' => $priceRange,
                    'avg_price_per_person' => $this->avgPriceForRange($priceRange),
                    'is_active' => true,
                    'is_verified' => true,
                    'verified_at' => now(),
                ],
            );

            $cuisineIds = $this->resolveCuisineIds($this->splitPipe($row['especialidad'] ?? null));
            if ($cuisineIds !== []) {
                $this->cuisines->sync($restaurant, $cuisineIds, $cuisineIds[0]);
            }

            $environmentIds = $this->resolveCatalogIds(
                RestaurantEnvironment::class,
                $this->splitPipe($row['entorno'] ?? null),
            );
            if ($environmentIds !== []) {
                $restaurant->restaurantEnvironments()->sync($environmentIds);
            }

            $momentIds = $this->resolveCatalogIds(
                RecommendedMoment::class,
                $this->splitPipe($row['momento'] ?? null),
            );
            if ($momentIds !== []) {
                $restaurant->recommendedMoments()->sync($momentIds);
            }

            $serviceIds = $this->resolveCatalogIds(
                Service::class,
                $this->splitPipe($row['servicios'] ?? null),
            );
            if ($serviceIds !== []) {
                $restaurant->services()->sync($serviceIds);
            }

            $partyIds = $this->resolveCatalogIds(
                PartyType::class,
                $this->splitPipe($row['publico'] ?? null),
            );
            if ($partyIds !== []) {
                $restaurant->partyTypes()->sync($partyIds);
            }

            $this->syncSchedules(
                $restaurant,
                $this->stringOrNull($row['dias'] ?? null),
                $this->stringOrNull($row['hora_apertura'] ?? null),
                $this->stringOrNull($row['hora_cierre'] ?? null),
            );

            return $wasExisting ? 'updated' : 'created';
        });
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'restaurante';
        $slug = $base;
        $n = 2;

        while (Restaurant::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$n;
            $n++;
        }

        return $slug;
    }

    /**
     * @return list<string>
     */
    private function splitPipe(mixed $value): array
    {
        if ($value === null || trim((string) $value) === '') {
            return [];
        }

        return array_values(array_filter(array_map(
            fn ($p) => trim($p),
            preg_split('/\s*\|\s*/', (string) $value) ?: [],
        )));
    }

    private function normalizePriceRange(mixed $value): string
    {
        $raw = str($value ?? '')->ascii()->lower()->trim()->toString();

        if ($raw === '') {
            return 'moderado';
        }

        if (str_contains($raw, 'econ') || $raw === 'bajo' || $raw === '1') {
            return 'economico';
        }

        if (str_contains($raw, 'prem') || str_contains($raw, 'alto') || $raw === '3') {
            return 'premium';
        }

        if (in_array($raw, ['economico', 'moderado', 'premium'], true)) {
            return $raw;
        }

        return 'moderado';
    }

    private function avgPriceForRange(string $range): float
    {
        return match ($range) {
            'economico' => 25.0,
            'premium' => 85.0,
            default => 45.0,
        };
    }

    private function resolveAmbiance(?string $name): ?Ambiance
    {
        if (! $name) {
            return null;
        }

        return Ambiance::firstOrCreate(
            ['slug' => Str::slug($name)],
            ['name' => $name, 'is_active' => true],
        );
    }

    /**
     * @param  list<string>  $names
     * @return list<int>
     */
    private function resolveCuisineIds(array $names): array
    {
        $ids = [];
        foreach ($names as $name) {
            $model = CuisineType::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'is_active' => true],
            );
            $ids[] = $model->id;
        }

        return $ids;
    }

    /**
     * @param  class-string  $modelClass
     * @param  list<string>  $names
     * @return list<int>
     */
    private function resolveCatalogIds(string $modelClass, array $names): array
    {
        $ids = [];
        foreach ($names as $name) {
            $model = $modelClass::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'is_active' => true],
            );
            $ids[] = $model->id;
        }

        return $ids;
    }

    private function syncSchedules(Restaurant $restaurant, ?string $days, ?string $opens, ?string $closes): void
    {
        if (! $opens || ! $closes) {
            return;
        }

        $openTime = $this->normalizeTime($opens);
        $closeTime = $this->normalizeTime($closes);
        if (! $openTime || ! $closeTime) {
            return;
        }

        $dayIndexes = $this->parseDays($days);

        foreach ($dayIndexes as $dow) {
            RestaurantSchedule::updateOrCreate(
                [
                    'restaurant_id' => $restaurant->id,
                    'day_of_week' => $dow,
                ],
                [
                    'opens_at' => $openTime,
                    'closes_at' => $closeTime,
                    'is_closed' => false,
                ],
            );
        }
    }

    /**
     * @return list<int>
     */
    private function parseDays(?string $days): array
    {
        if ($days === null || trim($days) === '') {
            return range(0, 6);
        }

        $normalized = str($days)->ascii()->lower()->trim()->toString();

        if (str_contains($normalized, 'lun-dom') || str_contains($normalized, 'lunes a domingo') || $normalized === 'todos') {
            return range(0, 6);
        }

        if (str_contains($normalized, 'lun-vie')) {
            return range(0, 4);
        }

        $map = [
            'lun' => 0, 'mar' => 1, 'mie' => 2, 'jue' => 3, 'vie' => 4, 'sab' => 5, 'dom' => 6,
        ];

        $found = [];
        foreach (preg_split('/[\s,;|]+/', $normalized) ?: [] as $token) {
            $token = trim($token);
            if (isset($map[$token])) {
                $found[] = $map[$token];
            }
        }

        return $found !== [] ? array_values(array_unique($found)) : range(0, 6);
    }

    private function normalizeTime(string $value): ?string
    {
        $value = trim($value);
        if (preg_match('/^(\d{1,2}):(\d{2})/', $value, $m)) {
            return sprintf('%02d:%02d:00', (int) $m[1], (int) $m[2]);
        }

        return null;
    }

    private function normalizeCoordinate(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        $n = (float) str_replace(',', '.', (string) $value);

        return $n != 0.0 ? round($n, 8) : null;
    }

    private function stringOrNull(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $s = trim((string) $value);

        return $s === '' ? null : $s;
    }

    private function truncate(?string $value, int $max): ?string
    {
        if ($value === null) {
            return null;
        }

        return mb_strlen($value) > $max ? mb_substr($value, 0, $max) : $value;
    }
}
