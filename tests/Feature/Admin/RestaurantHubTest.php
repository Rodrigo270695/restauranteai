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

test('super admin can open restaurant hub by numeric id in url', function () {
    $admin = superAdmin();
    $owner = User::factory()->create();
    $owner->assignRole('restaurant_owner');
    RestaurantProfile::create([
        'user_id' => $owner->id,
        'business_name' => 'Negocio ID',
        'phone' => '+51922222222',
        'address' => 'Calle 2',
        'description' => 'Desc',
        'status' => 'approved',
        'approved_at' => now(),
        'post_approval_completed_at' => now(),
    ]);
    $restaurant = Restaurant::create([
        'owner_id' => $owner->id,
        'name' => 'Local ID',
        'slug' => 'local-id-test',
        'is_active' => true,
    ]);

    $this->actingAs($admin)
        ->get("/app/admin/restaurants/{$restaurant->id}")
        ->assertOk();
});

test('super admin can impersonate and open owner restaurant profile', function () {
    $admin = superAdmin();
    $owner = User::factory()->create();
    $owner->assignRole('restaurant_owner');
    RestaurantProfile::create([
        'user_id' => $owner->id,
        'business_name' => 'Negocio Impersonar',
        'phone' => '+51933333333',
        'address' => 'Calle 3',
        'description' => 'Desc',
        'status' => 'approved',
        'approved_at' => now(),
        'post_approval_completed_at' => now(),
    ]);
    $restaurant = Restaurant::create([
        'owner_id' => $owner->id,
        'name' => 'Local Impersonar',
        'slug' => 'local-impersonar',
        'is_active' => true,
    ]);

    $this->actingAs($admin)
        ->post(route('app.admin.restaurants.manage.impersonate', $restaurant))
        ->assertRedirect(route('app.restaurants'));

    $this->actingAs($admin)
        ->get(route('app.restaurants'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('audienceSelection.party_type_ids')
            ->has('audienceSelection.restaurant_environment_ids')
            ->has('audienceSelection.recommended_moment_ids')
            ->where('ownerPanelReadOnly', true));
});

test('super admin can list admin restaurants', function () {
    $admin = superAdmin();

    $this->actingAs($admin)
        ->get(route('app.admin.restaurants'))
        ->assertOk();
});
