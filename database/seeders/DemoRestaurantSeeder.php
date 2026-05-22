<?php

namespace Database\Seeders;

use App\Models\Ambiance;
use App\Models\CuisineType;
use App\Models\Dish;
use App\Models\DishCategory;
use App\Models\District;
use App\Models\Restaurant;
use App\Models\RestaurantProfile;
use App\Models\RestaurantSchedule;
use App\Models\User;
use App\Services\RestaurantCuisineService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoRestaurantSeeder extends Seeder
{
    public function run(): void
    {
        $district = District::query()->where('name', 'Chiclayo')->first()
            ?? District::query()->first();

        if (! $district) {
            $this->command?->warn('⚠ Sin distritos: ejecuta LambayequeGeographySeeder primero.');

            return;
        }

        $owner = User::firstOrCreate(
            ['email' => 'dueno@restauranteai.com'],
            [
                'name' => 'Dueño Demo',
                'password' => Hash::make('Demo1234!'),
                'email_verified_at' => now(),
            ],
        );

        if (! $owner->hasRole('restaurant_owner')) {
            $owner->assignRole('restaurant_owner');
        }

        RestaurantProfile::firstOrCreate(
            ['user_id' => $owner->id],
            [
                'business_name' => 'Grupo Gastronómico Demo SAC',
                'phone' => '+51987654321',
                'address' => 'Av. Balta 123, Chiclayo',
                'city' => 'Chiclayo',
                'description' => 'Cadena demo para pruebas de la plataforma.',
                'status' => 'approved',
                'approved_at' => now(),
                'post_approval_completed_at' => now(),
            ],
        );

        $criolla = CuisineType::query()->where('slug', 'criolla')->first();
        $marina = CuisineType::query()->where('slug', 'marina')->first();
        $ceviche = CuisineType::query()->where('slug', 'ceviche')->first();
        $familiar = Ambiance::query()->where('slug', 'familiar')->first();
        $category = DishCategory::query()->where('slug', 'platos-de-fondo')->first()
            ?? DishCategory::query()->first();

        $demos = [
            [
                'name' => 'La Casona Criolla',
                'slug' => 'la-casona-criolla',
                'cuisine_type_id' => $criolla?->id,
                'price_range' => 'moderado',
                'short_description' => 'Sabores criollos en el corazón de Chiclayo.',
                'address' => 'Calle Izaga 250, Chiclayo',
                'latitude' => -6.77137000,
                'longitude' => -79.84088000,
                'avg_rating' => 4.60,
                'is_featured' => true,
            ],
            [
                'name' => 'Mar y Tierra Chiclayo',
                'slug' => 'mar-y-tierra-chiclayo',
                'cuisine_type_id' => $marina?->id,
                'price_range' => 'premium',
                'short_description' => 'Mariscos frescos y pescados del día.',
                'address' => 'Av. Santa Victoria 890, Chiclayo',
                'latitude' => -6.78210000,
                'longitude' => -79.82950000,
                'avg_rating' => 4.80,
                'is_featured' => true,
            ],
            [
                'name' => 'Cevichería El Pescador',
                'slug' => 'cevicheria-el-pescador',
                'cuisine_type_id' => $ceviche?->id,
                'price_range' => 'economico',
                'short_description' => 'Ceviches y chicharrones de conchas.',
                'address' => 'Av. Francisco Bolognesi 410, Chiclayo',
                'latitude' => -6.77650000,
                'longitude' => -79.83520000,
                'avg_rating' => 4.40,
                'is_featured' => false,
            ],
        ];

        $cuisineService = app(RestaurantCuisineService::class);

        foreach ($demos as $data) {
            $cuisineTypeId = $data['cuisine_type_id'] ?? null;
            unset($data['cuisine_type_id']);

            $avgPrice = match ($data['price_range']) {
                'economico' => 25.00,
                'premium' => 85.00,
                default => 45.00,
            };

            $restaurant = Restaurant::updateOrCreate(
                ['slug' => $data['slug']],
                [
                    ...$data,
                    'cuisine_type_id' => $cuisineTypeId,
                    'owner_id' => $owner->id,
                    'district_id' => $district->id,
                    'ambiance_id' => $familiar?->id,
                    'description' => $data['short_description'],
                    'phone' => '+51911111111',
                    'avg_price_per_person' => $avgPrice,
                    'capacity' => 60,
                    'total_reviews' => 12,
                    'total_views' => 340,
                    'is_active' => true,
                    'is_verified' => true,
                    'verified_at' => now(),
                ],
            );

            if ($restaurant->schedules()->count() === 0) {
                foreach (range(0, 6) as $day) {
                    RestaurantSchedule::create([
                        'restaurant_id' => $restaurant->id,
                        'day_of_week' => $day,
                        'opens_at' => '11:00',
                        'closes_at' => '22:00',
                        'is_closed' => false,
                    ]);
                }
            }

            $cuisineIds = array_filter([$cuisineTypeId]);
            if ($data['slug'] === 'la-casona-criolla' && $criolla && $ceviche) {
                $cuisineIds = [$criolla->id, $ceviche->id];
            }
            if ($cuisineIds !== []) {
                $cuisineService->sync($restaurant, $cuisineIds, $cuisineIds[0]);
            }

            if ($category && $restaurant->dishes()->count() === 0) {
                Dish::create([
                    'restaurant_id' => $restaurant->id,
                    'dish_category_id' => $category->id,
                    'name' => 'Plato bandera — '.$restaurant->name,
                    'description' => 'Especialidad de la casa para demostración.',
                    'price' => match ($restaurant->price_range) {
                        'economico' => 18.50,
                        'premium' => 68.00,
                        default => 32.00,
                    },
                    'is_available' => true,
                    'is_signature' => true,
                    'display_order' => 1,
                ]);
            }
        }

        $tourist = User::firstOrCreate(
            ['email' => 'turista@restauranteai.com'],
            [
                'name' => 'Turista Demo',
                'password' => Hash::make('Tourist1234!'),
                'email_verified_at' => now(),
            ],
        );

        if (! $tourist->hasRole('tourist')) {
            $tourist->assignRole('tourist');
        }

        $tourist->touristProfile()->firstOrCreate(
            ['user_id' => $tourist->id],
            [
                'city' => 'Chiclayo',
                'budget_preference' => 'medium',
                'preferred_cuisines' => ['Criolla', 'Marina'],
                'completed_at' => now(),
            ],
        );

        $this->command?->info('✔ Restaurantes demo activos/verificados y usuarios demo listos.');
        $this->command?->info('   Dueño: dueno@restauranteai.com / Demo1234!');
        $this->command?->info('   Turista: turista@restauranteai.com / Tourist1234!');
    }
}
