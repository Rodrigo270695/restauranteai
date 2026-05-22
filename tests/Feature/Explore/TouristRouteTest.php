<?php

use App\Models\CuisineType;
use App\Models\District;
use App\Models\Province;
use App\Models\Restaurant;
use App\Models\TouristRoute;
use App\Models\User;
use App\Models\Department;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

function tourist(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('tourist');

    return $user;
}

function verifiedRestaurant(array $overrides = []): Restaurant
{
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

    $slug = $overrides['slug'] ?? 'cevicheria-test-'.uniqid();

    return Restaurant::create(array_merge([
        'owner_id' => User::factory()->create()->id,
        'district_id' => $dist->id,
        'cuisine_type_id' => $cuisine->id,
        'name' => 'Cevichería Test',
        'slug' => $slug,
        'latitude' => -6.77,
        'longitude' => -79.84,
        'price_range' => 'moderado',
        'is_active' => true,
        'is_verified' => true,
    ], $overrides));
}

test('tourist can open discover with restaurants', function () {
    verifiedRestaurant();

    $this->actingAs(tourist())
        ->get(route('explore.discover'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('explore/discover/index')
            ->has('restaurants', 1));
});

test('tourist can build and publish a route', function () {
    $user = tourist();
    $r1 = verifiedRestaurant(['slug' => 'cevicheria-uno']);
    $r2 = verifiedRestaurant(['name' => 'Segundo', 'slug' => 'cevicheria-dos']);

    $this->actingAs($user)->post(route('explore.routes.stops.add', $r1->slug))->assertRedirect();
    $this->actingAs($user)->post(route('explore.routes.stops.add', $r2->slug))->assertRedirect();

    $this->actingAs($user)
        ->post(route('explore.routes.publish'), ['name' => 'Ruta Ceviche'])
        ->assertRedirect();

    $route = TouristRoute::where('user_id', $user->id)->where('status', 'active')->first();
    expect($route)->not->toBeNull();
    expect($route->route_date)->not->toBeNull();

    $this->actingAs($user)
        ->post(route('explore.routes.complete', $route))
        ->assertRedirect(route('explore.routes.index'));

    expect($route->fresh()->completed_at)->not->toBeNull();
});
