<?php

use App\Models\DietaryOption;
use App\Models\PartyType;
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

test('tourist can save multiple party types and dietary options', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('tourist');

    $familia = PartyType::where('slug', 'familia')->first();
    $amigos = PartyType::where('slug', 'amigos')->first();
    $vegano = DietaryOption::where('slug', 'vegano')->first();
    $vegetariano = DietaryOption::where('slug', 'vegetariano')->first();

    $this->actingAs($user)->post(route('explore.profile.update'), [
        'party_type_ids' => [$familia->id, $amigos->id],
        'dietary_option_ids' => [$vegano->id, $vegetariano->id],
    ])->assertRedirect();

    $pref = UserPreference::where('user_id', $user->id)->first();
    expect($pref->party_type_ids)->toHaveCount(2);
    expect($pref->party_type_ids)->toContain($familia->id, $amigos->id);
    expect($pref->dietary_option_ids)->toHaveCount(2);
    expect($pref->dietary_option_ids)->toContain($vegano->id, $vegetariano->id);
});

test('selecting ninguna dietary clears other dietary options', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('tourist');

    $ninguna = DietaryOption::where('slug', 'ninguna')->first();
    $vegano = DietaryOption::where('slug', 'vegano')->first();

    $this->actingAs($user)->post(route('explore.profile.update'), [
        'dietary_option_ids' => [$ninguna->id, $vegano->id],
    ])->assertRedirect();

    $pref = UserPreference::where('user_id', $user->id)->first();
    expect($pref->dietary_option_ids)->toEqual([$ninguna->id]);
});
