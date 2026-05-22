<?php

use App\Models\DishCategory;
use App\Models\Restaurant;
use App\Models\RestaurantProfile;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

function approvedOwnerWithRestaurant(): array
{
    $user = User::factory()->create(['email_verified_at' => null]);
    $user->assignRole('restaurant_owner');
    RestaurantProfile::create([
        'user_id' => $user->id,
        'business_name' => 'Demo SAC',
        'phone' => '+51999999999',
        'address' => 'Av. Test 1',
        'description' => 'Restaurante demo',
        'status' => 'approved',
        'approved_at' => now(),
        'post_approval_completed_at' => now(),
    ]);
    $restaurant = Restaurant::create([
        'owner_id' => $user->id,
        'name' => 'Restaurante Demo',
        'slug' => 'restaurante-demo-'.$user->id,
        'is_active' => true,
    ]);

    return [$user, $restaurant];
}

test('approved owner can create a dish', function () {
    [$user, $restaurant] = approvedOwnerWithRestaurant();
    $category = DishCategory::create(['name' => 'Fondos', 'slug' => 'fondos', 'is_active' => true]);

    $response = $this->actingAs($user)->post(route('app.dishes.store'), [
        'name' => 'Arroz con pato',
        'price' => 35.50,
        'dish_category_id' => $category->id,
        'is_available' => true,
    ]);

    $response->assertRedirect();
    expect($restaurant->dishes()->where('name', 'Arroz con pato')->exists())->toBeTrue();
});

test('approved owner can open dishes page', function () {
    [$user] = approvedOwnerWithRestaurant();

    $this->actingAs($user)
        ->get(route('app.dishes'))
        ->assertOk();
});
