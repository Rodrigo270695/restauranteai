<?php

use App\Models\Ambiance;
use App\Models\CuisineType;
use App\Models\DietaryOption;
use App\Models\PartyType;
use App\Models\Service;
use App\Models\SupportLanguage;
use App\Models\TamSurvey;
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

function touristUser(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('tourist');

    return $user;
}

test('tourist can save ml preferences from explore profile', function () {
    $user = touristUser();
    $cuisine = CuisineType::where('slug', 'criolla')->first();
    $ambiance = Ambiance::where('slug', 'familiar')->firstOrFail();
    $familia = PartyType::firstOrCreate(['slug' => 'familia'], ['name' => 'Familia', 'is_active' => true]);
    DietaryOption::firstOrCreate(
        ['slug' => 'ninguna'],
        ['name' => 'Ninguna', 'for_tourist_preference' => true, 'for_restaurant' => false, 'is_active' => true],
    );
    $wifi = Service::where('slug', 'wifi')->first();
    $spanish = SupportLanguage::where('code', 'es')->first();

    $response = $this->actingAs($user)->post(route('explore.profile.update'), [
        'budget_preference' => 'medium',
        'preferred_cuisines' => ['criolla'],
        'ambiance_id' => $ambiance->id,
        'price_range' => 'moderado',
        'max_distance_km' => 15,
        'party_type_ids' => [$familia->id],
        'dietary_option_ids' => [DietaryOption::where('slug', 'ninguna')->value('id')],
        'service_ids' => [$wifi->id],
        'language_ids' => [$spanish->id],
        'min_rating' => 4,
    ]);

    $response->assertRedirect();
    $pref = UserPreference::query()->where('user_id', $user->id)->first();
    expect($pref)->not->toBeNull();
    expect($pref->cuisine_type_id)->toBe($cuisine->id);
    expect($pref->service_ids)->toBe([$wifi->id]);
    expect($pref->language_ids)->toBe([$spanish->id]);
    expect((float) $pref->min_rating)->toBe(4.0);
    expect($user->fresh()->touristProfile?->preferred_cuisines)->toBe(['criolla']);
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
