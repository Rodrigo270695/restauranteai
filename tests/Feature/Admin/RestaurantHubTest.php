<?php

use App\Models\Restaurant;
use App\Models\RestaurantProfile;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

function superAdmin(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('super_admin');

    return $user;
}

test('super admin can open restaurant hub for owner restaurant', function () {
    $admin = superAdmin();
    $owner = User::factory()->create();
    $owner->assignRole('restaurant_owner');
    RestaurantProfile::create([
        'user_id' => $owner->id,
        'business_name' => 'Negocio Test',
        'phone' => '+51911111111',
        'address' => 'Calle 1',
        'description' => 'Desc',
        'status' => 'approved',
        'approved_at' => now(),
        'post_approval_completed_at' => now(),
    ]);
    $restaurant = Restaurant::create([
        'owner_id' => $owner->id,
        'name' => 'Local Test',
        'slug' => 'local-test',
        'is_active' => true,
        'is_verified' => true,
    ]);

    $this->actingAs($admin)
        ->get(route('app.admin.restaurants.manage.show', $restaurant))
        ->assertOk();
});

test('super admin can list admin restaurants', function () {
    $admin = superAdmin();

    $this->actingAs($admin)
        ->get(route('app.admin.restaurants'))
        ->assertOk();
});
