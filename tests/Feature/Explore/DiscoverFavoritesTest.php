<?php

use App\Models\CuisineType;
use App\Models\Department;
use App\Models\District;
use App\Models\Province;
use App\Models\Restaurant;
use App\Models\User;
use App\Models\UserInteraction;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

function favoritesTourist(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('tourist');

    return $user;
}

function favoritesRestaurant(string $slug): Restaurant
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

    return Restaurant::create([
        'owner_id' => User::factory()->create()->id,
        'district_id' => $dist->id,
        'cuisine_type_id' => $cuisine->id,
        'name' => 'Local '.$slug,
        'slug' => $slug,
        'price_range' => 'moderado',
        'latitude' => -6.77,
        'longitude' => -79.84,
        'is_active' => true,
        'is_verified' => true,
    ]);
}

test('discover favorites filter returns only favorited restaurants', function () {
    Http::fake();

    $user = favoritesTourist();
    $fav = favoritesRestaurant('fav-'.uniqid());
    $other = favoritesRestaurant('other-'.uniqid());

    UserInteraction::create([
        'user_id' => $user->id,
        'restaurant_id' => $fav->id,
        'interaction_type' => 'save',
    ]);

    $this->actingAs($user)
        ->get(route('explore.discover', ['favorites_only' => 1]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('explore/discover/index')
            ->where('filters.favorites_only', true)
            ->where('favoritesCount', 1)
            ->has('restaurants', 1)
            ->where('restaurants.0.slug', $fav->slug)
            ->where('restaurants.0.is_favorited', true));
});

test('guest public nav does not include active favorites link', function () {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('auth.roles')
            ->where('auth.user', null));
});
