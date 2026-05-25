<?php

use App\Models\CuisineType;
use App\Models\Department;
use App\Models\District;
use App\Models\Province;
use App\Models\Recommendation;
use App\Models\RecommendationRequest;
use App\Models\Restaurant;
use App\Models\User;
use App\Models\UserInteraction;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    config([
        'recommendations.use_ml_service' => true,
        'recommendations.ml_service_url' => 'http://127.0.0.1:8001',
    ]);
});

function interactionTourist(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('tourist');

    return $user;
}

function interactionRestaurant(): Restaurant
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
        'name' => 'Local Interacción',
        'slug' => 'local-int-'.uniqid(),
        'price_range' => 'moderado',
        'is_active' => true,
        'is_verified' => true,
    ]);
}

test('restaurant show records a daily view interaction', function () {
    Http::fake([
        'http://127.0.0.1:8001/api/v1/feedback' => Http::response(['status' => 'accepted']),
    ]);

    $user = interactionTourist();
    $restaurant = interactionRestaurant();

    $this->actingAs($user)
        ->get(route('explore.restaurants.show', $restaurant))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('explore/restaurants/show')
            ->where('isFavorited', false));

    expect(UserInteraction::query()
        ->where('user_id', $user->id)
        ->where('restaurant_id', $restaurant->id)
        ->where('interaction_type', 'view')
        ->count())->toBe(1);

    $this->actingAs($user)
        ->get(route('explore.restaurants.show', $restaurant))
        ->assertOk();

    expect(UserInteraction::query()
        ->where('interaction_type', 'view')
        ->count())->toBe(1);
});

test('tourist can favorite and unfavorite a restaurant', function () {
    Http::fake([
        'http://127.0.0.1:8001/api/v1/feedback' => Http::response(['status' => 'accepted']),
    ]);

    $user = interactionTourist();
    $restaurant = interactionRestaurant();

    $this->actingAs($user)
        ->post(route('explore.restaurants.interactions', $restaurant), [
            'interaction_type' => 'save',
        ])
        ->assertRedirect();

    expect(UserInteraction::where('interaction_type', 'save')->count())->toBe(1);

    $this->actingAs($user)
        ->get(route('explore.restaurants.show', $restaurant))
        ->assertInertia(fn ($page) => $page->where('isFavorited', true));

    $this->actingAs($user)
        ->post(route('explore.restaurants.interactions', $restaurant), [
            'interaction_type' => 'unsave',
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->get(route('explore.restaurants.show', $restaurant))
        ->assertInertia(fn ($page) => $page->where('isFavorited', false));
});

test('adding to route marks recommendation accepted', function () {
    Http::fake([
        'http://127.0.0.1:8001/api/v1/feedback' => Http::response(['status' => 'accepted']),
    ]);

    $user = interactionTourist();
    $restaurant = interactionRestaurant();

    $request = RecommendationRequest::create(['user_id' => $user->id, 'budget' => 'moderado']);
    Recommendation::create([
        'request_id' => $request->id,
        'restaurant_id' => $restaurant->id,
        'rank' => 1,
        'score' => 0.9,
    ]);

    $this->actingAs($user)
        ->post(route('explore.routes.stops.add', $restaurant->slug))
        ->assertRedirect();

    expect(Recommendation::first()->was_accepted)->toBeTrue();
    expect(UserInteraction::where('interaction_type', 'recommendation_accepted')->exists())->toBeTrue();
});

test('ml train command calls microservice', function () {
    Http::fake([
        'http://127.0.0.1:8001/api/v1/train' => Http::response([
            'status' => 'trained',
            'metadata' => ['users' => 5, 'restaurants' => 10],
        ]),
    ]);

    $this->artisan('ml:train --sync')
        ->assertSuccessful();
});
