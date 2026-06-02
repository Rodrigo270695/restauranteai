<?php

use App\Models\District;
use App\Models\Restaurant;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\LambayequeGeographySeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\artisan;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(CatalogSeeder::class);
    $this->seed(LambayequeGeographySeeder::class);
});

it('registers restaurants import command', function () {
    artisan('restaurants:import', ['--help' => true])->assertExitCode(0);
});

it('imports a row from csv plantilla', function () {
    $csv = storage_path('framework/testing/import-sample.csv');
    if (! is_dir(dirname($csv))) {
        mkdir(dirname($csv), 0755, true);
    }

    file_put_contents($csv, implode("\n", [
        'nombre,especialidad_gastronomica,categoria_establecimiento,entorno_restaurante,ambiente_restaurante,rango_precios,momento_recomendado,servicios,ubicacion,publico_objetivo,dias,hora_apertura,hora_cierre,direccion,latitud,longitud,descripcion_corta,telefono',
        'Import Test Criollo,Criolla,Restaurante tradicional,Urbano,Casual,moderado,Almuerzo,WiFi,Chiclayo,Turistas,lun-dom,11:00,22:00,Calle Test 1,-6.77137,-79.84088,Descripcion test,+51999999999',
    ]));

    artisan('restaurants:import', ['file' => $csv, '--owner' => 'import-test@example.com'])
        ->assertExitCode(0);

    $district = District::query()->where('name', 'Chiclayo')->first();

    expect(Restaurant::query()->where('name', 'Import Test Criollo')->exists())->toBeTrue();

    $restaurant = Restaurant::query()->where('name', 'Import Test Criollo')->first();
    expect($restaurant->district_id)->toBe($district->id)
        ->and($restaurant->is_active)->toBeTrue()
        ->and($restaurant->is_verified)->toBeTrue()
        ->and($restaurant->schedules()->count())->toBe(7);

    expect(User::query()->where('email', 'import-test@example.com')->exists())->toBeTrue();
});
