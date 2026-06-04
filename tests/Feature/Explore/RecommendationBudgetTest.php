<?php

use App\Models\TouristProfile;
use App\Models\User;
use App\Models\UserPreference;
use App\Support\BudgetPreference;
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
        'recommendations.default_top_n' => 10,
    ]);
});

test('recommendation payload includes mixed budget price ranges', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('tourist');

    TouristProfile::create([
        'user_id' => $user->id,
        'budget_preference' => ['medium', 'high'],
        'completed_at' => now(),
    ]);

    Http::fake([
        'http://127.0.0.1:8001/api/v1/health' => Http::response(['status' => 'ok']),
        'http://127.0.0.1:8001/api/v1/recommend' => function ($request) {
            $body = $request->data();
            expect($body['top_n'])->toBeGreaterThanOrEqual(30);
            expect($body['context']['price_ranges'])->toBe(['moderado', 'caro']);
            expect($body['context']['budgets'])->toBe(['medium', 'high']);

            return Http::response([
                'algorithm' => 'hybrid',
                'cold_start' => true,
                'recommendations' => [],
            ]);
        },
    ]);

    app(\App\Services\RecommendationService::class)->forUser($user, fresh: true);
});

test('recommendation service defaults to ten results', function () {
    expect((int) config('recommendations.default_top_n'))->toBe(10);
});
