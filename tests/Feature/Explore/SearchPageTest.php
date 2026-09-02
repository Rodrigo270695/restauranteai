<?php

use App\Models\CuisineType;
use App\Models\Department;
use App\Models\District;
use App\Models\Province;
use App\Models\Restaurant;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    Http::fake();
});

test('tourist search page lists restaurants without route payload', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('tourist');

    $dept = Department::firstOrCreate(['code' => '14'], ['name' => 'Lambayeque']);
    $prov = Province::firstOrCreate(
        ['code' => '1401'],
        ['name' => 'Chiclayo', 'department_id' => $dept->id],
    );
    $dist = District::firstOrCreate(
        ['code' => '140101'],
        ['name' => 'Chiclayo', 'province_id' => $prov->id],
    );
    $cuisine = CuisineType::firstOrCreate(
        ['slug' => 'criolla'],
        ['name' => 'Criolla', 'is_active' => true],
    );

    $match = Restaurant::create([
        'owner_id' => User::factory()->create()->id,
        'district_id' => $dist->id,
        'cuisine_type_id' => $cuisine->id,
        'name' => 'Local search',
        'slug' => 'local-search-'.uniqid(),
        'price_range' => 'moderado',
        'latitude' => -6.77,
        'longitude' => -79.84,
        'is_active' => true,
        'is_verified' => true,
    ]);

    $this->actingAs($user)
        ->get(route('explore.search'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('explore/search/index')
            ->has('restaurants', 1)
            ->where('restaurants.0.slug', $match->slug)
            ->missing('draftRoute')
            ->missing('markers'));
});

test('guest can open the explore search page', function () {
    $dept = Department::firstOrCreate(['code' => '14'], ['name' => 'Lambayeque']);
    $prov = Province::firstOrCreate(
        ['code' => '1401'],
        ['name' => 'Chiclayo', 'department_id' => $dept->id],
    );
    $dist = District::firstOrCreate(
        ['code' => '140101'],
        ['name' => 'Chiclayo', 'province_id' => $prov->id],
    );
    $cuisine = CuisineType::firstOrCreate(
        ['slug' => 'ceviche'],
        ['name' => 'Ceviche', 'is_active' => true],
    );

    Restaurant::create([
        'owner_id' => User::factory()->create()->id,
        'district_id' => $dist->id,
        'cuisine_type_id' => $cuisine->id,
        'name' => 'Public search',
        'slug' => 'public-search-'.uniqid(),
        'price_range' => 'moderado',
        'latitude' => -6.77,
        'longitude' => -79.84,
        'is_active' => true,
        'is_verified' => true,
    ]);

    $this->get(route('explore.search'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('explore/search/index')
            ->has('restaurants', 1));
});
