<?php

use App\Models\CuisineType;
use App\Models\Department;
use App\Models\District;
use App\Models\PartyType;
use App\Models\Province;
use App\Models\Restaurant;
use App\Models\RestaurantEnvironment;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    Http::fake();
});

function discoverFilterTourist(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('tourist');

    return $user;
}

function discoverFilterRestaurant(array $extra = []): Restaurant
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
        ['slug' => 'criolla'],
        ['name' => 'Criolla', 'is_active' => true],
    );

    return Restaurant::create(array_merge([
        'owner_id' => User::factory()->create()->id,
        'district_id' => $dist->id,
        'cuisine_type_id' => $cuisine->id,
        'name' => 'Local '.uniqid(),
        'slug' => 'local-'.uniqid(),
        'price_range' => 'moderado',
        'latitude' => -6.77,
        'longitude' => -79.84,
        'is_active' => true,
        'is_verified' => true,
    ], $extra));
}

test('discover filters restaurants by cuisine ids', function () {
    $user = discoverFilterTourist();
    $criolla = CuisineType::firstOrCreate(['slug' => 'criolla'], ['name' => 'Criolla', 'is_active' => true]);
    $marina = CuisineType::firstOrCreate(['slug' => 'marina'], ['name' => 'Marina', 'is_active' => true]);

    $match = discoverFilterRestaurant(['cuisine_type_id' => $marina->id, 'slug' => 'marina-spot']);
    discoverFilterRestaurant(['cuisine_type_id' => $criolla->id, 'slug' => 'criolla-spot']);

    $this->actingAs($user)
        ->get(route('explore.discover', ['cuisine_type_ids' => [$marina->id]]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('explore/discover/index')
            ->has('restaurants', 1)
            ->where('restaurants.0.slug', $match->slug)
            ->where('pagination.total', 1));
});

test('discover filters restaurants by party type', function () {
    $user = discoverFilterTourist();
    $familia = PartyType::create(['name' => 'Familia', 'slug' => 'familia', 'is_active' => true]);
    $pareja = PartyType::create(['name' => 'Pareja', 'slug' => 'pareja', 'is_active' => true]);

    $familyPlace = discoverFilterRestaurant(['slug' => 'family-place']);
    $familyPlace->partyTypes()->attach($familia->id);
    $couplePlace = discoverFilterRestaurant(['slug' => 'couple-place']);
    $couplePlace->partyTypes()->attach($pareja->id);

    $this->actingAs($user)
        ->get(route('explore.discover', ['party_type_ids' => [$familia->id]]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('restaurants', 1)
            ->where('restaurants.0.slug', $familyPlace->slug));
});

test('discover filters restaurants by environment', function () {
    $user = discoverFilterTourist();
    $urbano = RestaurantEnvironment::create(['name' => 'Urbano', 'slug' => 'urbano', 'is_active' => true]);
    $mar = RestaurantEnvironment::create(['name' => 'Vista al mar', 'slug' => 'vista-al-mar', 'is_active' => true]);

    $city = discoverFilterRestaurant(['slug' => 'city-place']);
    $city->restaurantEnvironments()->attach($urbano->id);
    $beach = discoverFilterRestaurant(['slug' => 'beach-place']);
    $beach->restaurantEnvironments()->attach($mar->id);

    $this->actingAs($user)
        ->get(route('explore.discover', ['restaurant_environment_ids' => [$urbano->id]]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('restaurants', 1)
            ->where('restaurants.0.slug', $city->slug));
});

test('discover paginates filtered results', function () {
    $user = discoverFilterTourist();
    foreach (range(1, 10) as $i) {
        discoverFilterRestaurant(['slug' => "page-{$i}-".uniqid(), 'name' => "Local {$i}"]);
    }

    $this->actingAs($user)
        ->get(route('explore.discover', ['page' => 2]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('pagination.current_page', 2)
            ->where('pagination.per_page', 8)
            ->where('pagination.total', 10)
            ->has('restaurants', 2));
});
