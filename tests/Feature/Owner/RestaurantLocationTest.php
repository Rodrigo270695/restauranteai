<?php

use App\Models\CuisineType;
use App\Models\Department;
use App\Models\District;
use App\Models\Province;
use App\Models\Restaurant;
use App\Models\RestaurantProfile;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

function locationOwner(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('restaurant_owner');
    RestaurantProfile::create([
        'user_id' => $user->id,
        'business_name' => 'Cadena Demo SAC',
        'status' => 'approved',
        'approved_at' => now(),
        'post_approval_completed_at' => now(),
    ]);

    return $user;
}

function locationRestaurant(User $owner): Restaurant
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
        'owner_id' => $owner->id,
        'district_id' => $dist->id,
        'cuisine_type_id' => $cuisine->id,
        'name' => 'Local Ubicación',
        'slug' => 'local-ubic-'.uniqid(),
        'price_range' => 'moderado',
        'is_active' => true,
        'is_verified' => true,
    ]);
}

test('owner can save map coordinates on restaurant profile', function () {
    $owner = locationOwner();
    $restaurant = locationRestaurant($owner);

    $this->actingAs($owner)
        ->put(route('app.restaurants.update'), restaurantUpdatePayload($restaurant, [
            'address' => 'Av. Balta 100',
            'latitude' => -6.77137,
            'longitude' => -79.84088,
            'cuisine_type_ids' => [$restaurant->cuisine_type_id],
            'primary_cuisine_type_id' => $restaurant->cuisine_type_id,
        ]))
        ->assertRedirect();

    $restaurant->refresh();
    expect($restaurant->latitude)->toEqual(-6.77137)
        ->and($restaurant->longitude)->toEqual(-79.84088);
});

test('owner can create a second restaurant and switch active location', function () {
    $owner = locationOwner();
    locationRestaurant($owner);

    $this->actingAs($owner)
        ->post(route('app.restaurants.locations.store'), ['name' => 'Sucursal Norte'])
        ->assertRedirect(route('app.restaurants'));

    expect($owner->restaurants()->count())->toBe(2);

    $second = $owner->restaurants()->where('name', 'Sucursal Norte')->first();
    expect($second)->not->toBeNull();

    $this->actingAs($owner)
        ->post(route('app.restaurants.switch'), ['restaurant_id' => $second->id])
        ->assertRedirect(route('app.restaurants'));

    $this->actingAs($owner)
        ->get(route('app.restaurants'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activeRestaurantId', $second->id)
            ->has('ownedRestaurants', 2));
});

test('geocode endpoint returns coordinates from nominatim', function () {
    Http::fake([
        'nominatim.openstreetmap.org/*' => Http::response([
            ['lat' => '-6.7713700', 'lon' => '-79.8408800', 'importance' => 0.05, 'place_rank' => 26, 'display_name' => 'Av. Balta, Chiclayo, Lambayeque, Perú'],
        ]),
    ]);

    $owner = locationOwner();
    locationRestaurant($owner);

    $this->actingAs($owner)
        ->postJson(route('app.restaurants.geocode'), ['address' => 'Av. Balta 100 Chiclayo'])
        ->assertOk()
        ->assertJson(['lat' => -6.77137, 'lng' => -79.84088]);
});

test('geocode avoids duplicating region when address already includes city', function () {
    Http::fake([
        'nominatim.openstreetmap.org/*' => function ($request) {
            parse_str((string) parse_url($request->url(), PHP_URL_QUERY), $query);
            $freeTextQuery = $query['q'] ?? null;

            if ($freeTextQuery !== null) {
                expect($freeTextQuery)->not->toContain('Lambayeque, Perú, Lambayeque');
                expect($freeTextQuery)->not->toEndWith('Lambayeque, Perú');
            }

            return Http::response([
                [
                    'lat' => '-6.7711046',
                    'lon' => '-79.8403280',
                    'importance' => 0.05,
                    'place_rank' => 26,
                    'display_name' => 'Avenida San José, Chiclayo, Lambayeque, Perú',
                ],
            ]);
        },
    ]);

    $owner = locationOwner();
    locationRestaurant($owner);

    $this->actingAs($owner)
        ->postJson(route('app.restaurants.geocode'), [
            'address' => 'av. san jose 545, chiclayo, Perú',
            'province' => 'Chiclayo',
            'department' => 'Lambayeque',
        ])
        ->assertOk()
        ->assertJson(['lat' => -6.7711046, 'lng' => -79.840328]);
});

test('owner cannot save restaurant without complete location', function () {
    $owner = locationOwner();
    $restaurant = locationRestaurant($owner);

    $this->actingAs($owner)
        ->from(route('app.restaurants'))
        ->put(route('app.restaurants.update'), [
            'name' => $restaurant->name,
            'price_range' => 'moderado',
        ])
        ->assertRedirect(route('app.restaurants'))
        ->assertSessionHasErrors(['district_id', 'address', 'latitude', 'longitude']);

    $restaurant->refresh();
    expect($restaurant->latitude)->toBeNull();
});

test('completing location during onboarding unlocks the panel', function () {
    $owner = locationOwner();
    $owner->restaurantProfile->update(['post_approval_completed_at' => null]);
    $restaurant = locationRestaurant($owner);

    $this->actingAs($owner)
        ->put(route('app.restaurants.update'), restaurantUpdatePayload($restaurant, [
            'address' => 'Av. Balta 100',
            'latitude' => -6.77137,
            'longitude' => -79.84088,
        ]))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($owner->restaurantProfile->fresh()->post_approval_completed_at)->not->toBeNull();
});
