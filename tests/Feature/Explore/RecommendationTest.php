<?php

use App\Models\CuisineType;
use App\Models\Department;
use App\Models\District;
use App\Models\Province;
use App\Models\Recommendation;
use App\Models\RecommendationRequest;
use App\Models\RecommendedMoment;
use App\Models\Restaurant;
use App\Models\RestaurantEnvironment;
use App\Models\User;
use App\Models\UserPreference;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(CatalogSeeder::class);
    config([
        'recommendations.use_ml_service' => true,
        'recommendations.ml_service_url' => 'http://127.0.0.1:8001',
        'recommendations.ml_api_key' => 'test-key',
    ]);
});

function recTourist(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('tourist');

    return $user;
}

function recRestaurant(): Restaurant
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
        'name' => 'Restaurante ML Test',
        'slug' => 'rest-ml-'.uniqid(),
        'latitude' => -6.77,
        'longitude' => -79.84,
        'price_range' => 'moderado',
        'avg_rating' => 4.5,
        'total_reviews' => 10,
        'is_active' => true,
        'is_verified' => true,
    ]);
}

test('tourist portal shows recommendations from ml service', function () {
    $user = recTourist();
    $restaurant = recRestaurant();

    $vista = RestaurantEnvironment::where('slug', 'vista_al_mar')->first();
    $cena = RecommendedMoment::where('slug', 'cena')->first();

    UserPreference::create([
        'user_id' => $user->id,
        'cuisine_type_id' => $restaurant->cuisine_type_id,
        'price_range' => 'moderado',
        'max_distance_km' => 20,
        'restaurant_environment_ids' => $vista ? [$vista->id] : [],
        'recommended_moment_ids' => $cena ? [$cena->id] : [],
    ]);

    if ($vista) {
        $restaurant->restaurantEnvironments()->sync([$vista->id]);
    }
    if ($cena) {
        $restaurant->recommendedMoments()->sync([$cena->id]);
    }

    Http::fake([
        'http://127.0.0.1:8001/api/v1/health' => Http::response(['status' => 'ok']),
        'http://127.0.0.1:8001/api/v1/recommend' => function ($request) use ($restaurant) {
            $body = $request->data();
            expect($body['context']['restaurant_environment_ids'] ?? [])->not->toBeEmpty();
            expect($body['context']['recommended_moment_ids'] ?? [])->not->toBeEmpty();

            return Http::response([
                'algorithm' => 'hybrid',
                'cold_start' => false,
                'recommendations' => [
                    [
                        'restaurant_id' => $restaurant->id,
                        'rank' => 1,
                        'score' => 0.92,
                        'content_score' => 0.5,
                        'collaborative_score' => 0.3,
                        'context_score' => 0.12,
                    ],
                ],
            ]);
        },
    ]);

    $this->actingAs($user)
        ->get(route('explore.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('explore/index')
            ->has('recommendations', 1)
            ->where('recommendationMeta.algorithm', 'hybrid')
            ->where('recommendationMeta.ml_available', true));

    expect(RecommendationRequest::count())->toBe(1);
    expect(Recommendation::count())->toBe(1);
});

test('tourist portal shows nothing when ml service is down', function () {
    $user = recTourist();
    recRestaurant();

    Http::fake([
        'http://127.0.0.1:8001/api/v1/health' => Http::response([], 503),
        'http://127.0.0.1:8001/api/v1/recommend' => Http::response([], 503),
    ]);

    $this->actingAs($user)
        ->get(route('explore.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('explore/index')
            ->has('recommendations', 0)
            ->where('recommendationMeta.algorithm', 'unavailable')
            ->where('recommendationMeta.ml_available', false));

    expect(RecommendationRequest::count())->toBe(0);
    expect(Recommendation::count())->toBe(0);
});

test('tourist portal shows nothing when ml health passes but recommend fails', function () {
    $user = recTourist();
    recRestaurant();

    Http::fake([
        'http://127.0.0.1:8001/api/v1/health' => Http::response(['status' => 'ok']),
        'http://127.0.0.1:8001/api/v1/recommend' => Http::response([], 503),
    ]);

    $this->actingAs($user)
        ->get(route('explore.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('recommendations', 0)
            ->where('recommendationMeta.algorithm', 'unavailable')
            ->where('recommendationMeta.ml_available', false));

    expect(RecommendationRequest::count())->toBe(0);
});
