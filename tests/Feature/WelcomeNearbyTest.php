<?php

use App\Models\CuisineType;
use App\Models\Department;
use App\Models\District;
use App\Models\Province;
use App\Models\Restaurant;
use App\Models\RestaurantEnvironment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function welcomeRestaurant(array $overrides = []): Restaurant
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

    return Restaurant::create(array_merge([
        'owner_id' => User::factory()->create()->id,
        'district_id' => $dist->id,
        'cuisine_type_id' => $cuisine->id,
        'name' => 'Restaurante Test',
        'slug' => 'rest-'.uniqid(),
        'latitude' => -6.771,
        'longitude' => -79.841,
        'price_range' => 'moderado',
        'is_active' => true,
        'is_verified' => true,
        'avg_price_per_person' => 45,
    ], $overrides));
}

test('welcome page lists all restaurants with pagination', function () {
    welcomeRestaurant(['name' => 'Uno', 'slug' => 'rest-uno']);
    welcomeRestaurant(['name' => 'Dos', 'slug' => 'rest-dos']);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('welcome')
            ->has('restaurants.data', 2)
            ->where('restaurants.total', 2)
            ->where('filters.sort', 'featured'));
});

test('welcome ignores nearby sort and geolocation query params', function () {
    welcomeRestaurant();

    $this->get(route('home', [
        'lat' => -6.77,
        'lng' => -79.84,
        'sort' => 'nearby',
    ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.sort', 'featured')
            ->missing('filters.lat'));
});

test('welcome filters restaurants by minimum rating', function () {
    welcomeRestaurant(['name' => 'Bajo', 'slug' => 'rest-bajo', 'avg_rating' => 3.2]);
    welcomeRestaurant(['name' => 'Alto', 'slug' => 'rest-alto', 'avg_rating' => 4.6]);

    $this->get(route('home', ['min_rating' => 4]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.min_rating', 4)
            ->has('restaurants.data', 1)
            ->where('restaurants.data.0.name', 'Alto'));
});

test('nearby page sorts restaurants by distance when location filter is active', function () {
    welcomeRestaurant([
        'name' => 'Lejos',
        'slug' => 'rest-lejos',
        'latitude' => -6.95,
        'longitude' => -79.95,
    ]);
    welcomeRestaurant([
        'name' => 'Cerca',
        'slug' => 'rest-cerca',
        'latitude' => -6.7715,
        'longitude' => -79.8405,
    ]);

    $this->get(route('restaurants.nearby', [
        'lat' => -6.77,
        'lng' => -79.84,
        'location_active' => 1,
    ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('public/restaurants-nearby')
            ->where('filters.sort', 'nearby')
            ->where('filters.location_active', true)
            ->where('restaurants.data.0.name', 'Cerca')
            ->where('restaurants.data.0.distance_km', fn ($km) => $km !== null && $km < 5));
});

test('nearby page ignores coordinates without location filter', function () {
    welcomeRestaurant([
        'name' => 'Lejos',
        'slug' => 'rest-lejos-2',
        'latitude' => -6.95,
        'longitude' => -79.95,
    ]);
    welcomeRestaurant([
        'name' => 'Cerca',
        'slug' => 'rest-cerca-2',
        'latitude' => -6.7715,
        'longitude' => -79.8405,
        'is_featured' => true,
    ]);

    $this->get(route('restaurants.nearby', [
        'lat' => -6.77,
        'lng' => -79.84,
    ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('public/restaurants-nearby')
            ->where('filters.sort', 'featured')
            ->where('filters.location_active', false)
            ->missing('filters.lat')
            ->where('restaurants.data.0.name', 'Cerca'));
});

test('welcome restaurant cards include restaurant environments', function () {
    $env = RestaurantEnvironment::firstOrCreate(
        ['slug' => 'vista_al_mar'],
        ['name' => 'Vista al mar', 'is_active' => true],
    );
    $restaurant = welcomeRestaurant(['name' => 'Con Entorno', 'slug' => 'rest-entorno']);
    $restaurant->restaurantEnvironments()->sync([$env->id]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('restaurants.data', 1)
            ->where('restaurants.data.0.environments', ['Vista al mar']));
});
