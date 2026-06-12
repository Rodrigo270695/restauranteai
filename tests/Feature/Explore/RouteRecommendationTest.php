<?php

use App\Models\CuisineType;
use App\Models\Department;
use App\Models\District;
use App\Models\Province;
use App\Models\Restaurant;
use App\Models\TouristProfile;
use App\Models\User;
use App\Models\UserPreference;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    config([
        'recommendations.use_ml_service' => true,
        'recommendations.ml_service_url' => 'http://127.0.0.1:8001',
        'recommendations.ml_api_key' => 'test-key',
    ]);
});

function routeTourist(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('tourist');

    return $user;
}

function routeRestaurant(string $slug, float $lat, float $lng): Restaurant
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
        'name' => 'Local '.$slug,
        'slug' => $slug,
        'latitude' => $lat,
        'longitude' => $lng,
        'price_range' => 'moderado',
        'avg_rating' => 4.5,
        'is_active' => true,
        'is_verified' => true,
    ]);
}

test('tourist can generate ai route draft and land on discover map', function () {
    $user = routeTourist();
    $r1 = routeRestaurant('ruta-a', -6.770, -79.840);
    $r2 = routeRestaurant('ruta-b', -6.775, -79.845);
    $r3 = routeRestaurant('ruta-c', -6.780, -79.850);

    Http::fake([
        'http://127.0.0.1:8001/api/v1/health' => Http::response(['status' => 'ok']),
        'http://127.0.0.1:8001/api/v1/recommend' => Http::response([
            'algorithm' => 'hybrid',
            'cold_start' => false,
            'recommendations' => [
                ['restaurant_id' => $r1->id, 'rank' => 1, 'score' => 0.92],
                ['restaurant_id' => $r2->id, 'rank' => 2, 'score' => 0.85],
                ['restaurant_id' => $r3->id, 'rank' => 3, 'score' => 0.78],
            ],
        ]),
    ]);

    TouristProfile::create([
        'user_id' => $user->id,
        'preferred_cuisines' => ['criolla'],
        'budget_preference' => ['medium'],
        'completed' => true,
    ]);

    UserPreference::create([
        'user_id' => $user->id,
        'cuisine_type_id' => $r1->cuisine_type_id,
        'price_range' => 'moderado',
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->post(route('explore.routes.recommend'), ['lat' => -6.772, 'lng' => -79.842])
        ->assertRedirect(route('explore.discover', ['view' => 'map']));

    $draft = $user->touristRoutes()->where('status', 'draft')->first();
    expect($draft)->not->toBeNull()
        ->and($draft->generated_by_ai)->toBeTrue()
        ->and($draft->stops()->count())->toBeGreaterThanOrEqual(2)
        ->and($draft->stops()->count())->toBeLessThanOrEqual(5);
});
