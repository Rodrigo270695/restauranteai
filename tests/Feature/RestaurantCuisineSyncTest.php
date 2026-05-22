<?php

use App\Models\CuisineType;
use App\Models\Restaurant;
use App\Models\RestaurantProfile;
use App\Models\User;
use App\Services\RestaurantCuisineService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

test('restaurant can sync multiple cuisine types with one primary', function () {
    $criolla = CuisineType::create(['name' => 'Criolla', 'slug' => 'criolla', 'is_active' => true]);
    $ceviche = CuisineType::create(['name' => 'Ceviche', 'slug' => 'ceviche', 'is_active' => true]);

    $owner = User::factory()->create();
    $owner->assignRole('restaurant_owner');
    RestaurantProfile::create([
        'user_id' => $owner->id,
        'business_name' => 'Test',
        'phone' => '+51999999999',
        'address' => 'Av 1',
        'description' => 'Desc',
        'status' => 'approved',
        'approved_at' => now(),
        'post_approval_completed_at' => now(),
    ]);

    $restaurant = Restaurant::create([
        'owner_id' => $owner->id,
        'name' => 'Local Mixto',
        'slug' => 'local-mixto',
    ]);

    app(RestaurantCuisineService::class)->sync($restaurant, [$criolla->id, $ceviche->id], $ceviche->id);

    $restaurant->refresh()->load('cuisineTypes');

    expect($restaurant->cuisineTypes)->toHaveCount(2);
    expect($restaurant->cuisine_type_id)->toBe($ceviche->id);
    expect((bool) $restaurant->cuisineTypes->firstWhere('id', $ceviche->id)?->pivot->is_primary)->toBeTrue();
});

test('owner can save multiple cuisines from profile form', function () {
    $criolla = CuisineType::create(['name' => 'Criolla', 'slug' => 'criolla', 'is_active' => true]);
    $chifa = CuisineType::create(['name' => 'Chifa', 'slug' => 'chifa', 'is_active' => true]);

    $user = User::factory()->create();
    $user->assignRole('restaurant_owner');
    RestaurantProfile::create([
        'user_id' => $user->id,
        'business_name' => 'Test',
        'phone' => '+51999999999',
        'address' => 'Av 1',
        'description' => 'Desc',
        'status' => 'approved',
        'approved_at' => now(),
        'post_approval_completed_at' => now(),
    ]);
    $restaurant = Restaurant::create([
        'owner_id' => $user->id,
        'name' => 'Mi Local',
        'slug' => 'mi-local',
        'price_range' => 'moderado',
    ]);

    $this->actingAs($user)->put(route('app.restaurants.update'), [
        'name' => 'Mi Local',
        'price_range' => 'moderado',
        'cuisine_type_ids' => [$criolla->id, $chifa->id],
        'primary_cuisine_type_id' => $criolla->id,
    ])->assertRedirect();

    $restaurant->refresh()->load('cuisineTypes');
    expect($restaurant->cuisineTypes->pluck('id')->all())->toEqual([$criolla->id, $chifa->id]);
});
