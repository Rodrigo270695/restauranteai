<?php

use App\Models\RestaurantProfile;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

test('pending restaurant owner cannot access dashboard', function () {
    $user = User::factory()->create(['email_verified_at' => null]);
    $user->assignRole('restaurant_owner');
    RestaurantProfile::create([
        'user_id'       => $user->id,
        'business_name' => 'Test SAC',
        'status'        => 'pending',
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(route('owner.pending'));
});

test('pending restaurant owner cannot access settings profile', function () {
    $user = User::factory()->create(['email_verified_at' => null]);
    $user->assignRole('restaurant_owner');
    RestaurantProfile::create([
        'user_id'       => $user->id,
        'business_name' => 'Test SAC',
        'status'        => 'pending',
    ]);

    $this->actingAs($user)
        ->get(route('profile.edit'))
        ->assertRedirect(route('owner.pending'));
});

test('approved restaurant owner can access dashboard after post-approval onboarding', function () {
    $user = User::factory()->create(['email_verified_at' => null]);
    $user->assignRole('restaurant_owner');
    RestaurantProfile::create([
        'user_id'                      => $user->id,
        'business_name'                => 'Test SAC',
        'phone'                        => '+51999999999',
        'address'                      => 'Av. Test 123',
        'description'                  => 'Restaurante de prueba',
        'status'                       => 'approved',
        'approved_at'                  => now(),
        'post_approval_completed_at'   => now(),
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();
});

test('approved owner with onboarding done can open app module placeholder', function () {
    $user = User::factory()->create(['email_verified_at' => null]);
    $user->assignRole('restaurant_owner');
    RestaurantProfile::create([
        'user_id'                    => $user->id,
        'business_name'              => 'Test SAC',
        'phone'                      => '+51999999999',
        'address'                    => 'Av. Test 123',
        'description'                => 'Listo',
        'status'                     => 'approved',
        'approved_at'                => now(),
        'post_approval_completed_at' => now(),
    ]);

    $this->actingAs($user)
        ->get('/app/restaurants')
        ->assertOk();
});

test('approved owner without post-approval completion is redirected from security to profile', function () {
    $user = User::factory()->create(['email_verified_at' => null]);
    $user->assignRole('restaurant_owner');
    RestaurantProfile::create([
        'user_id'       => $user->id,
        'business_name' => 'Test SAC',
        'phone'         => '+51999999999',
        'address'       => 'Av. Test 123',
        'description'   => 'Listo',
        'status'        => 'approved',
        'approved_at'   => now(),
    ]);

    $this->actingAs($user)
        ->get(route('security.edit'))
        ->assertRedirect(route('profile.edit'));
});
