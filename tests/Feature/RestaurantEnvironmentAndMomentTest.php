<?php

use App\Models\RecommendedMoment;
use App\Models\Restaurant;
use App\Models\RestaurantEnvironment;
use App\Models\RestaurantProfile;
use App\Models\User;
use App\Models\UserPreference;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(CatalogSeeder::class);
});

test('owner can save restaurant environments and recommended moments', function () {
    $owner = User::factory()->create(['email_verified_at' => now()]);
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
        'district_id' => basicGeoDistrict()->id,
        'name' => 'Local Entorno',
        'slug' => 'local-entorno',
        'price_range' => 'moderado',
        'address' => 'Av. Test 1',
        'latitude' => -6.77137,
        'longitude' => -79.84088,
    ]);

    $vista = RestaurantEnvironment::where('slug', 'vista_al_mar')->firstOrFail();
    $urbano = RestaurantEnvironment::where('slug', 'urbano')->firstOrFail();
    $almuerzo = RecommendedMoment::where('slug', 'almuerzo')->firstOrFail();
    $cena = RecommendedMoment::where('slug', 'cena')->firstOrFail();

    $this->actingAs($owner)
        ->put(route('app.restaurants.update'), restaurantUpdatePayload($restaurant, [
            'restaurant_environment_ids' => [$vista->id, $urbano->id],
            'recommended_moment_ids' => [$almuerzo->id, $cena->id],
        ]))
        ->assertRedirect();

    $restaurant->refresh()->load(['restaurantEnvironments', 'recommendedMoments']);

    expect($restaurant->restaurantEnvironments->pluck('slug')->all())
        ->toEqualCanonicalizing(['vista_al_mar', 'urbano']);
    expect($restaurant->recommendedMoments->pluck('slug')->all())
        ->toEqualCanonicalizing(['almuerzo', 'cena']);
});

test('tourist can save environment and moment preferences', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('tourist');

    $centro = RestaurantEnvironment::where('slug', 'centro_historico')->firstOrFail();
    $brunch = RecommendedMoment::where('slug', 'brunch')->firstOrFail();

    $this->actingAs($user)
        ->post(route('explore.profile.update'), [
            'restaurant_environment_ids' => [$centro->id],
            'recommended_moment_ids' => [$brunch->id],
        ])
        ->assertRedirect();

    $pref = UserPreference::where('user_id', $user->id)->first();
    expect($pref->restaurant_environment_ids)->toBe([$centro->id]);
    expect($pref->recommended_moment_ids)->toBe([$brunch->id]);
});
