<?php

use App\Models\CuisineType;
use App\Models\TouristProfile;
use App\Models\User;
use App\Models\UserPreference;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\LambayequeGeographySeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(CatalogSeeder::class);
    $this->seed(LambayequeGeographySeeder::class);
});

function setupTourist(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('tourist');

    return $user;
}

test('tourist setup page exposes catalog data from administration', function () {
    $user = setupTourist();

    $this->actingAs($user)
        ->get(route('profile.setup'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('tourist/profile-setup')
            ->has('cuisineTypes', CuisineType::where('is_active', true)->count())
            ->has('districts')
            ->has('budgetOptions', 3)
            ->where('cuisineTypes', fn ($types) => collect($types)->pluck('slug')->contains('criolla')));
});

test('tourist can skip profile setup and reach explore', function () {
    $user = setupTourist();

    $this->actingAs($user)
        ->post(route('profile.setup.store'), ['skip' => true])
        ->assertRedirect(route('explore.discover'));

    $profile = $user->fresh()->touristProfile;
    expect($profile)->not->toBeNull();
    expect($profile->isCompleted())->toBeTrue();
});

test('tourist can save setup with real cuisine slugs and district', function () {
    $user = setupTourist();

    $this->actingAs($user)
        ->post(route('profile.setup.store'), [
            'city' => 'Chiclayo',
            'bio' => 'Amo el ceviche norteño',
            'budget_preference' => 'medium',
            'preferred_cuisines' => ['criolla', 'ceviche'],
        ])
        ->assertRedirect(route('explore.discover'));

    $profile = TouristProfile::where('user_id', $user->id)->first();
    expect($profile->city)->toBe('Chiclayo');
    expect($profile->preferred_cuisines)->toBe(['criolla', 'ceviche']);
    expect($profile->isCompleted())->toBeTrue();

    expect(UserPreference::where('user_id', $user->id)->value('price_range'))->toBe('moderado');
});

test('completed tourist is redirected away from setup', function () {
    $user = setupTourist();
    TouristProfile::create([
        'user_id' => $user->id,
        'completed_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('profile.setup'))
        ->assertRedirect(route('explore.discover'));
});

test('invalid cuisine slug is rejected on setup save', function () {
    $user = setupTourist();

    $this->actingAs($user)
        ->post(route('profile.setup.store'), [
            'preferred_cuisines' => ['pizza-inventada'],
        ])
        ->assertSessionHasErrors('preferred_cuisines.0');
});
