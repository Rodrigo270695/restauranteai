<?php

namespace Database\Seeders;

use App\Models\Ambiance;
use App\Models\CuisineType;
use App\Models\DishCategory;
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

        $this->command->info('✔ Catálogos base sembrados.');
    }
}
