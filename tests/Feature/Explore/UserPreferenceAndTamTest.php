<?php

use App\Models\Ambiance;
use App\Models\CuisineType;
use App\Models\TamSurvey;
use App\Models\User;
use App\Models\UserPreference;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

function touristUser(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('tourist');

    return $user;
}

test('tourist can save ml preferences from explore profile', function () {
    $user = touristUser();
    $cuisine = CuisineType::create(['name' => 'Criolla', 'slug' => 'criolla', 'is_active' => true]);
    $ambiance = Ambiance::create(['name' => 'Familiar', 'slug' => 'familiar', 'is_active' => true]);

    $response = $this->actingAs($user)->post(route('explore.profile.update'), [
        'city' => 'Chiclayo',
        'budget_preference' => 'medium',
        'preferred_cuisines' => ['Criolla'],
        'cuisine_type_id' => $cuisine->id,
        'ambiance_id' => $ambiance->id,
        'price_range' => 'moderado',
        'max_distance_km' => 15,
        'party_type' => 'familia',
        'dietary_restriction' => 'ninguna',
    ]);

    $response->assertRedirect();
    expect(UserPreference::query()->where('user_id', $user->id)->count())->toBe(1);
    expect($user->fresh()->touristProfile?->city)->toBe('Chiclayo');
});

test('tourist can submit full tam survey once', function () {
    $user = touristUser();

    $payload = [
        'pu1_useful' => 5,
        'pu2_faster' => 4,
        'pu3_productivity' => 5,
        'pu4_effectiveness' => 4,
        'peou1_easy_to_learn' => 5,
        'peou2_controllable' => 4,
        'peou3_clear_understandable' => 5,
        'peou4_easy_to_use' => 5,
        'bi1_intend_to_use' => 4,
        'bi2_recommend' => 5,
        'open_comment' => 'Muy útil para turistas.',
    ];

    $this->actingAs($user)
        ->post(route('explore.tam-survey.store'), $payload)
        ->assertRedirect(route('explore.index'));

    $survey = TamSurvey::query()->where('user_id', $user->id)->first();
    expect($survey)->not->toBeNull();
    expect($survey->pu2_faster)->toBe(4);
    expect($survey->bi2_recommend)->toBe(5);

    $this->actingAs($user)
        ->post(route('explore.tam-survey.store'), $payload)
        ->assertRedirect(route('explore.tam-survey'));
});
