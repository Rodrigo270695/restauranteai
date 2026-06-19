<?php

use App\Models\DietaryOption;
use App\Models\PartyType;
use App\Models\Restaurant;
use App\Models\RestaurantProfile;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(CatalogSeeder::class);
});

test('owner can save party types and dietary options on restaurant profile', function () {
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
        'district_id' => basicGeoDistrict()->id,
        'name' => 'Local Demo',
        'slug' => 'local-demo',
        'price_range' => 'moderado',
        'address' => 'Av. Test 1',
        'latitude' => -6.77137,
        'longitude' => -79.84088,
    ]);

    $familia = PartyType::where('slug', 'familia')->first();
    $vegetariano = DietaryOption::where('slug', 'vegetariano')->first();

    $this->actingAs($user)->put(route('app.restaurants.update'), restaurantUpdatePayload($restaurant, [
        'party_type_ids' => [$familia->id],
        'dietary_option_ids' => [$vegetariano->id],
    ]))->assertRedirect();

    $restaurant->refresh()->load(['partyTypes', 'dietaryOptions']);

    expect($restaurant->partyTypes->pluck('slug')->all())->toBe(['familia']);
    expect($restaurant->dietaryOptions->pluck('slug')->all())->toBe(['vegetariano']);
});
