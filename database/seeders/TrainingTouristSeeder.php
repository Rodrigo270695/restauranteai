<?php

namespace Database\Seeders;

use App\Models\Ambiance;
use App\Models\CuisineType;
use App\Models\DietaryOption;
use App\Models\District;
use App\Models\PartyType;
use App\Models\RecommendedMoment;
use App\Models\Restaurant;
use App\Models\RestaurantEnvironment;
use App\Models\Service;
use App\Models\SupportLanguage;
use App\Models\TouristProfile;
use App\Models\User;
use App\Models\UserPreference;
use App\Support\BudgetPreference;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

/**
 * Genera turistas sintéticos para entrenamiento / pruebas del motor de recomendaciones.
 *
 * Uso: php artisan db:seed --class=TrainingTouristSeeder
 */
class TrainingTouristSeeder extends Seeder
{
    private const COUNT = 100;

    private const EMAIL_DOMAIN = 'miskigo.test';

    private const PASSWORD = 'Training2026!';

    /** @var list<string> */
    private array $firstNames = [
        'María', 'José', 'Carlos', 'Ana', 'Luis', 'Rosa', 'Pedro', 'Lucía', 'Miguel', 'Carmen',
        'Jorge', 'Patricia', 'Ricardo', 'Elena', 'Fernando', 'Gabriela', 'Héctor', 'Isabel', 'Julio', 'Karina',
        'Andrea', 'Diego', 'Valeria', 'Sergio', 'Daniela', 'Roberto', 'Camila', 'Alberto', 'Natalia', 'Oscar',
    ];

    /** @var list<string> */
    private array $lastNames = [
        'Vásquez', 'Chávez', 'Paredes', 'Ruiz', 'García', 'Flores', 'Díaz', 'Castillo', 'Rojas', 'Mendoza',
        'Silva', 'Torres', 'Ramírez', 'Herrera', 'Morales', 'Gutiérrez', 'Reyes', 'Cruz', 'Ortiz', 'Medina',
    ];

    /** @var list<string> */
    private array $bioTemplates = [
        'Me encanta probar ceviche fresco y platos de la cocina norteña.',
        'Viajo por Lambayeque buscando locales auténticos y buen ambiente.',
        'Prefiero lugares tranquilos para almorzar en familia los fines de semana.',
        'Soy fan de la chifa y la comida criolla con sabor casero.',
        'Busco restaurantes con buena puntuación y precios accesibles.',
        'Me gusta descubrir especialidades lambayecanas fuera de lo turístico.',
        'Priorizo locales con terraza y música en vivo para salir de noche.',
        'Exploro rutas gastronómicas con amigos; siempre dejo reseña.',
        'Amante del mar: ceviche, chicharrón de pescado y causas.',
        'Prefiero opciones vegetarianas cuando el menú lo permite.',
    ];

    public function run(): void
    {
        $role = Role::firstOrCreate(['name' => 'tourist', 'guard_name' => 'web']);

        $catalog = $this->loadCatalog();

        if ($catalog['districts'] === []) {
            $this->command->warn('⚠ No hay distritos de Lambayeque. Ejecuta LambayequeGeographySeeder primero.');
        }

        if ($catalog['cuisines']->isEmpty()) {
            $this->command->warn('⚠ No hay tipos de cocina activos. Ejecuta CatalogSeeder primero.');
        }

        $restaurantIds = Restaurant::query()
            ->where('is_active', true)
            ->where('is_verified', true)
            ->pluck('id')
            ->all();

        $created = 0;
        $skipped = 0;

        DB::transaction(function () use ($role, $catalog, $restaurantIds, &$created, &$skipped) {
            for ($i = 1; $i <= self::COUNT; $i++) {
                $email = sprintf('training.tourist.%03d@%s', $i, self::EMAIL_DOMAIN);

                if (User::query()->where('email', $email)->exists()) {
                    $skipped++;

                    continue;
                }

                $name = $this->randomName();
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'email_verified_at' => now(),
                    'password' => Hash::make(self::PASSWORD),
                ]);
                $user->assignRole($role);

                $profileData = $this->randomProfile($catalog);
                $profile = TouristProfile::create([
                    'user_id' => $user->id,
                    ...$profileData,
                ]);

                UserPreference::create(
                    $this->randomPreferences($user->id, $profileData, $catalog),
                );

                if ($restaurantIds !== []) {
                    $this->seedInteractions($user->id, $restaurantIds, $profileData);
                }

                $created++;
            }
        });

        $this->command->info("✔ Turistas de entrenamiento: {$created} creados, {$skipped} ya existían (omitidos).");
        $this->command->info('  Email: training.tourist.001@'.self::EMAIL_DOMAIN.' … training.tourist.100@'.self::EMAIL_DOMAIN);
        $this->command->info('  Contraseña: '.self::PASSWORD);

        if ($restaurantIds === []) {
            $this->command->warn('  Sin restaurantes activos: no se generaron interacciones. Ejecuta DemoRestaurantSeeder.');
        }
    }

    /** @return array<string, mixed> */
    private function loadCatalog(): array
    {
        return [
            'cuisines' => CuisineType::query()->where('is_active', true)->get(['id', 'slug', 'name']),
            'districts' => District::query()
                ->whereHas('province.department', fn ($q) => $q->where('code', '14'))
                ->orderBy('name')
                ->pluck('name')
                ->all(),
            'ambiances' => Ambiance::query()->where('is_active', true)->pluck('id')->all(),
            'party_types' => PartyType::query()->where('is_active', true)->pluck('id')->all(),
            'dietary_options' => DietaryOption::query()
                ->where('is_active', true)
                ->where('for_tourist_preference', true)
                ->pluck('id')
                ->all(),
            'environments' => RestaurantEnvironment::query()->where('is_active', true)->pluck('id')->all(),
            'moments' => RecommendedMoment::query()->where('is_active', true)->pluck('id')->all(),
            'services' => Service::query()->where('is_active', true)->pluck('id')->all(),
            'languages' => SupportLanguage::query()->where('is_active', true)->pluck('id')->all(),
        ];
    }

    private function randomName(): string
    {
        return fake()->randomElement($this->firstNames).' '.fake()->randomElement($this->lastNames);
    }

    /**
     * @param  array<string, mixed>  $catalog
     * @return array<string, mixed>
     */
    private function randomProfile(array $catalog): array
    {
        $cuisineSlugs = $catalog['cuisines']->pluck('slug')->all();
        $preferred = $this->randomSubset($cuisineSlugs, 1, min(3, count($cuisineSlugs)));

        $budgetCount = fake()->numberBetween(1, 2);
        $budgets = fake()->randomElements(BudgetPreference::VALUES, $budgetCount);

        $city = $catalog['districts'] !== []
            ? fake()->randomElement($catalog['districts'])
            : fake()->randomElement(['Chiclayo', 'Lambayeque', 'Ferreñafe']);

        return [
            'city' => $city,
            'bio' => fake()->randomElement($this->bioTemplates),
            'birth_date' => fake()->dateTimeBetween('-55 years', '-19 years')->format('Y-m-d'),
            'preferred_cuisines' => $preferred,
            'budget_preference' => array_values($budgets),
            'completed_at' => fake()->dateTimeBetween('-120 days', '-1 day'),
        ];
    }

    /**
     * @param  array<string, mixed>  $profileData
     * @param  array<string, mixed>  $catalog
     * @return array<string, mixed>
     */
    private function randomPreferences(int $userId, array $profileData, array $catalog): array
    {
        $preferredSlugs = $profileData['preferred_cuisines'] ?? [];
        $cuisineTypeId = null;

        if ($preferredSlugs !== []) {
            $cuisineTypeId = $catalog['cuisines']
                ->firstWhere('slug', fake()->randomElement($preferredSlugs))
                ?->id;
        }

        $priceRange = BudgetPreference::singlePriceRange($profileData['budget_preference'])
            ?? fake()->randomElement(['economico', 'moderado', 'caro']);

        return [
            'user_id' => $userId,
            'cuisine_type_id' => $cuisineTypeId,
            'ambiance_id' => $this->pickRandomId($catalog['ambiances']),
            'price_range' => $priceRange,
            'max_distance_km' => fake()->randomElement([5, 8, 10, 12, 15, 20, 25]),
            'party_type_ids' => $this->randomIdSubset($catalog['party_types'], 0, 2),
            'dietary_option_ids' => $this->randomIdSubset($catalog['dietary_options'], 0, 2),
            'restaurant_environment_ids' => $this->randomIdSubset($catalog['environments'], 0, 2),
            'recommended_moment_ids' => $this->randomIdSubset($catalog['moments'], 1, 3),
            'service_ids' => $this->randomIdSubset($catalog['services'], 0, 4),
            'language_ids' => $this->randomIdSubset($catalog['languages'], 1, 2),
            'min_rating' => fake()->optional(0.65)->randomElement([3.5, 4.0, 4.5]),
        ];
    }

    /**
     * Historial sintético de interacciones (sin llamar al microservicio ML).
     *
     * @param  list<int>  $restaurantIds
     * @param  array<string, mixed>  $profileData
     */
    private function seedInteractions(int $userId, array $restaurantIds, array $profileData): void
    {
        $interactionCount = fake()->numberBetween(8, 35);
        $rows = [];
        $savedRestaurants = [];

        for ($n = 0; $n < $interactionCount; $n++) {
            $restaurantId = fake()->randomElement($restaurantIds);
            $type = $this->randomInteractionType($savedRestaurants, $restaurantId);

            if ($type === 'save') {
                $savedRestaurants[$restaurantId] = true;
            }

            $rows[] = [
                'user_id' => $userId,
                'restaurant_id' => $restaurantId,
                'interaction_type' => $type,
                'search_query' => fake()->optional(0.15)->randomElement([
                    'ceviche', 'chifa', 'criolla', 'desayuno', 'mariscos', 'causa', 'seco',
                ]),
                'created_at' => fake()->dateTimeBetween('-90 days', 'now'),
            ];
        }

        foreach (array_chunk($rows, 50) as $chunk) {
            DB::table('user_interactions')->insert($chunk);
        }
    }

    /**
     * @param  array<int, bool>  $savedRestaurants
     */
    private function randomInteractionType(array $savedRestaurants, int $restaurantId): string
    {
        $weights = [
            'view' => 70,
            'save' => 15,
            'click' => 10,
            'recommendation_accepted' => 5,
        ];

        $type = fake()->randomElement($this->weightedPick($weights));

        if ($type === 'save' && isset($savedRestaurants[$restaurantId])) {
            return 'view';
        }

        return $type;
    }

    /**
     * @param  array<string, int>  $weights
     * @return list<string>
     */
    private function weightedPick(array $weights): array
    {
        $pool = [];

        foreach ($weights as $value => $weight) {
            for ($i = 0; $i < $weight; $i++) {
                $pool[] = $value;
            }
        }

        return $pool;
    }

    /**
     * @param  list<int|string>  $items
     * @return list<int|string>
     */
    private function randomSubset(array $items, int $min, int $max): array
    {
        if ($items === []) {
            return [];
        }

        $max = min($max, count($items));
        $min = min($min, $max);
        $count = fake()->numberBetween($min, $max);

        return array_values(fake()->randomElements($items, $count));
    }

    /**
     * @param  list<int>  $ids
     * @return list<int>
     */
    private function randomIdSubset(array $ids, int $min, int $max): array
    {
        return array_map('intval', $this->randomSubset($ids, $min, $max));
    }

    /** @param  list<int>  $ids */
    private function pickRandomId(array $ids): ?int
    {
        if ($ids === []) {
            return null;
        }

        return fake()->randomElement($ids);
    }
}
