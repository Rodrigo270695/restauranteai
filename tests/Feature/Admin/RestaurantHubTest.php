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
            ->where('ownerPanelReadOnly', false));
});

test('super admin can update restaurant profile from admin manage route', function () {
    $admin = superAdmin();
    $owner = User::factory()->create();
    $owner->assignRole('restaurant_owner');
    RestaurantProfile::create([
        'user_id' => $owner->id,
        'business_name' => 'Negocio Update',
        'phone' => '+51944444444',
        'address' => 'Calle 4',
        'description' => 'Desc',
        'status' => 'approved',
        'approved_at' => now(),
        'post_approval_completed_at' => now(),
    ]);
    $restaurant = Restaurant::create([
        'owner_id' => $owner->id,
        'name' => 'Antes',
        'slug' => 'antes-update',
        'price_range' => 'economico',
        'is_active' => true,
    ]);

    $this->actingAs($admin)
        ->put(route('app.admin.restaurants.manage.profile.update', $restaurant), [
            'name' => 'Después Admin',
            'price_range' => 'moderado',
        ])
        ->assertRedirect();

    expect($restaurant->fresh()->name)->toBe('Después Admin');
});

test('super admin can create dish while impersonating owner panel', function () {
    $admin = superAdmin();
    $owner = User::factory()->create();
    $owner->assignRole('restaurant_owner');
    RestaurantProfile::create([
        'user_id' => $owner->id,
        'business_name' => 'Negocio Plato',
        'phone' => '+51955555555',
        'address' => 'Calle 5',
        'description' => 'Desc',
        'status' => 'approved',
        'approved_at' => now(),
        'post_approval_completed_at' => now(),
    ]);
    $restaurant = Restaurant::create([
        'owner_id' => $owner->id,
        'name' => 'Local Plato',
        'slug' => 'local-plato',
        'is_active' => true,
    ]);
    $category = DishCategory::create(['name' => 'Entradas', 'slug' => 'entradas', 'is_active' => true]);

    $this->actingAs($admin)
        ->post(route('app.admin.restaurants.manage.impersonate', $restaurant));

    $this->actingAs($admin)
        ->post(route('app.dishes.store'), [
            'name' => 'Ceviche mixto',
            'price' => 28,
            'dish_category_id' => $category->id,
            'is_available' => true,
        ])
        ->assertRedirect();

    expect($restaurant->dishes()->where('name', 'Ceviche mixto')->exists())->toBeTrue();
});

test('super admin can list admin restaurants', function () {
    $admin = superAdmin();

    $this->actingAs($admin)
        ->get(route('app.admin.restaurants'))
        ->assertOk();
});
