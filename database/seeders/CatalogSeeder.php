<?php

namespace Database\Seeders;

use App\Models\Ambiance;
use App\Models\CuisineType;
use App\Models\DietaryOption;
use App\Models\DishCategory;
use App\Models\PartyType;
use App\Models\RecommendedMoment;
use App\Models\RestaurantEnvironment;
use App\Models\Service;
use App\Models\SupportLanguage;
use Illuminate\Database\Seeder;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Criolla', 'Marina', 'Ceviche', 'Chifa', 'Lambayecana'] as $name) {
            CuisineType::firstOrCreate(['slug' => str($name)->slug()], ['name' => $name, 'is_active' => true]);
        }

        foreach (['Familiar', 'Romántico', 'Casual', 'Cultural'] as $name) {
            Ambiance::firstOrCreate(['slug' => str($name)->slug()], ['name' => $name, 'is_active' => true]);
        }

        foreach ([
            'WiFi',
            'Estacionamiento',
            'Delivery',
            'Reservas',
            'Terraza',
            'Música en vivo',
            'Acceso silla de ruedas',
            'Acepta mascotas',
            'Pago con tarjeta',
            'Para llevar',
        ] as $name) {
            Service::firstOrCreate(['slug' => str($name)->slug()], ['name' => $name, 'is_active' => true]);
        }

        foreach (['Entradas', 'Platos de fondo', 'Postres', 'Bebidas'] as $i => $name) {
            DishCategory::firstOrCreate(['slug' => str($name)->slug()], ['name' => $name, 'display_order' => $i, 'is_active' => true]);
        }

        foreach ([['Español', 'es'], ['English', 'en'], ['Quechua', 'qu']] as [$name, $code]) {
            SupportLanguage::firstOrCreate(['code' => $code], ['name' => $name, 'is_active' => true]);
        }

        foreach ([
            ['Solo', 'solo'],
            ['En pareja', 'pareja'],
            ['Familia', 'familia'],
            ['Amigos', 'amigos'],
            ['Negocios', 'negocios'],
        ] as [$name, $slug]) {
            PartyType::firstOrCreate(['slug' => $slug], ['name' => $name, 'is_active' => true]);
        }

        foreach ([
            ['Vista al mar', 'vista_al_mar'],
            ['Campestre', 'campestre'],
            ['Urbano', 'urbano'],
            ['Centro histórico', 'centro_historico'],
            ['Centro comercial', 'centro_comercial'],
        ] as [$name, $slug]) {
            RestaurantEnvironment::firstOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'is_active' => true],
            );
        }

        foreach ([
            ['Desayuno', 'desayuno'],
            ['Almuerzo', 'almuerzo'],
            ['Cena', 'cena'],
            ['Brunch', 'brunch'],
            ['Bar', 'bar'],
        ] as [$name, $slug]) {
            RecommendedMoment::firstOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'is_active' => true],
            );
        }

        foreach ([
            ['Ninguna', 'ninguna', true, false],
            ['Vegetariano', 'vegetariano', true, true],
            ['Vegano', 'vegano', true, true],
            ['Sin gluten', 'sin_gluten', true, true],
            ['Halal', 'halal', true, true],
        ] as [$name, $slug, $forTourist, $forRestaurant]) {
            DietaryOption::firstOrCreate(
                ['slug' => $slug],
                [
                    'name' => $name,
                    'for_tourist_preference' => $forTourist,
                    'for_restaurant' => $forRestaurant,
                    'is_active' => true,
                ],
            );
        }

        $this->command->info('✔ Catálogos base sembrados.');
    }
}
