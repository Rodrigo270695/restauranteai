<?php

namespace Database\Seeders;

use App\Models\Ambiance;
use App\Models\CuisineType;
use App\Models\DietaryOption;
use App\Models\Dish;
use App\Models\DishCategory;
use App\Models\District;
use App\Models\PartyType;
use App\Models\RecommendedMoment;
use App\Models\Restaurant;
use App\Models\RestaurantEnvironment;
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
        $familia = PartyType::query()->where('slug', 'familia')->first();
        $pareja = PartyType::query()->where('slug', 'pareja')->first();
        $vegetariano = DietaryOption::query()->where('slug', 'vegetariano')->first();
        $sinGluten = DietaryOption::query()->where('slug', 'sin_gluten')->first();
        $vistaMar = RestaurantEnvironment::query()->where('slug', 'vista_al_mar')->first();
        $urbano = RestaurantEnvironment::query()->where('slug', 'urbano')->first();
        $centroHistorico = RestaurantEnvironment::query()->where('slug', 'centro_historico')->first();
        $almuerzo = RecommendedMoment::query()->where('slug', 'almuerzo')->first();
        $cena = RecommendedMoment::query()->where('slug', 'cena')->first();
        $desayuno = RecommendedMoment::query()->where('slug', 'desayuno')->first();
        $bar = RecommendedMoment::query()->where('slug', 'bar')->first();
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

            $partyIds = array_filter([$familia?->id, $pareja?->id]);
            if ($partyIds !== []) {
                $restaurant->partyTypes()->sync($partyIds);
            }

            $dietaryIds = array_filter([$vegetariano?->id, $sinGluten?->id]);
            if ($data['slug'] === 'cevicheria-el-pescador') {
                $dietaryIds = array_filter([$sinGluten?->id]);
            }
            if ($dietaryIds !== []) {
                $restaurant->dietaryOptions()->sync($dietaryIds);
            }

            $environmentIds = match ($data['slug']) {
                'mar-y-tierra-chiclayo' => array_filter([$vistaMar?->id, $urbano?->id]),
                'la-casona-criolla' => array_filter([$urbano?->id, $centroHistorico?->id]),
                'cevicheria-el-pescador' => array_filter([$urbano?->id]),
                default => array_filter([$urbano?->id]),
            };
            if ($environmentIds !== []) {
                $restaurant->restaurantEnvironments()->sync($environmentIds);
            }

            $momentIds = match ($data['slug']) {
                'mar-y-tierra-chiclayo' => array_filter([$almuerzo?->id, $cena?->id]),
                'la-casona-criolla' => array_filter([$desayuno?->id, $almuerzo?->id, $cena?->id]),
                'cevicheria-el-pescador' => array_filter([$almuerzo?->id, $bar?->id]),
                default => array_filter([$almuerzo?->id]),
            };
            if ($momentIds !== []) {
                $restaurant->recommendedMoments()->sync($momentIds);
            }

            $this->seedDemoMenu($restaurant, $data['slug']);
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

    private function seedDemoMenu(Restaurant $restaurant, string $slug): void
    {
        $entradas = DishCategory::query()->where('slug', 'entradas')->first();
        $fondos = DishCategory::query()->where('slug', 'platos-de-fondo')->first();
        $bebidas = DishCategory::query()->where('slug', 'bebidas')->first();
        $postres = DishCategory::query()->where('slug', 'postres')->first();

        $menus = [
            'cevicheria-el-pescador' => [
                ['cat' => $entradas, 'name' => 'Ceviche de pescado', 'description' => 'Pescado fresco del día en leche de tigre, cebolla morada y camote.', 'price' => 28.00, 'signature' => true, 'order' => 1],
                ['cat' => $entradas, 'name' => 'Chicharrón de conchas', 'description' => 'Conchas negras crocantes con salsa criolla y yuca.', 'price' => 32.00, 'signature' => false, 'order' => 2],
                ['cat' => $fondos, 'name' => 'Arroz con mariscos', 'description' => 'Arroz verde con pulpo, calamar y almejas al estilo norteño.', 'price' => 38.00, 'signature' => false, 'order' => 3],
                ['cat' => $bebidas, 'name' => 'Chicha morada', 'description' => 'Jarra refrescante de maíz morado y especias.', 'price' => 12.00, 'signature' => false, 'order' => 4],
                ['cat' => $bebidas, 'name' => 'Limonada frozen', 'description' => 'Limonada helada con hierbabuena.', 'price' => 10.00, 'signature' => false, 'order' => 5],
                ['cat' => $postres, 'name' => 'Suspiro a la limeña', 'description' => 'Postre clásico de manjar blanco y merengue.', 'price' => 14.00, 'signature' => false, 'order' => 6],
            ],
            'la-casona-criolla' => [
                ['cat' => $entradas, 'name' => 'Tamal norteño', 'description' => 'Tamal envuelto en hoja de plátano con aceituna y huevo.', 'price' => 18.00, 'signature' => false, 'order' => 1],
                ['cat' => $fondos, 'name' => 'Seco de cabrito', 'description' => 'Cabrito estofado con frejoles y arroz.', 'price' => 42.00, 'signature' => true, 'order' => 2],
                ['cat' => $fondos, 'name' => 'Arroz con pato', 'description' => 'Pato confitado con arroz verde y cilantro.', 'price' => 45.00, 'signature' => false, 'order' => 3],
                ['cat' => $bebidas, 'name' => 'Refresco de chicha', 'description' => 'Vaso de chicha de jora artesanal.', 'price' => 8.00, 'signature' => false, 'order' => 4],
                ['cat' => $postres, 'name' => 'Mazamorra morada', 'description' => 'Postre de maíz morado con frutas y canela.', 'price' => 12.00, 'signature' => false, 'order' => 5],
            ],
            'mar-y-tierra-chiclayo' => [
                ['cat' => $entradas, 'name' => 'Pulpo al olivo', 'description' => 'Pulpo tierno con salsa de aceitunas y papas.', 'price' => 48.00, 'signature' => true, 'order' => 1],
                ['cat' => $fondos, 'name' => 'Parrilla marina', 'description' => 'Mix de langostinos, pescado y calamares a la parrilla.', 'price' => 85.00, 'signature' => true, 'order' => 2],
                ['cat' => $fondos, 'name' => 'Risotto de conchas', 'description' => 'Arroz cremoso con conchas y parmesano.', 'price' => 58.00, 'signature' => false, 'order' => 3],
                ['cat' => $bebidas, 'name' => 'Pisco sour clásico', 'description' => 'Cóctel de pisco, limón y amargo de angostura.', 'price' => 22.00, 'signature' => false, 'order' => 4],
                ['cat' => $bebidas, 'name' => 'Agua mineral', 'description' => 'Botella 500 ml, con o sin gas.', 'price' => 6.00, 'signature' => false, 'order' => 5],
                ['cat' => $postres, 'name' => 'Cheesecake de maracuyá', 'description' => 'Base de galleta y crema ácida de maracuyá.', 'price' => 18.00, 'signature' => false, 'order' => 6],
            ],
        ];

        foreach ($menus[$slug] ?? [] as $item) {
            if ($item['cat'] === null) {
                continue;
            }

            Dish::updateOrCreate(
                [
                    'restaurant_id' => $restaurant->id,
                    'name' => $item['name'],
                ],
                [
                    'dish_category_id' => $item['cat']->id,
                    'description' => $item['description'],
                    'price' => $item['price'],
                    'is_available' => true,
                    'is_signature' => $item['signature'],
                    'display_order' => $item['order'],
                ],
            );
        }
    }
}
