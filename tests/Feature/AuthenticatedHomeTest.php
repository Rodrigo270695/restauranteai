<?php

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

function authTourist(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('tourist');

    return $user;
}

test('authenticated tourist is redirected from register without 403', function () {
    $this->actingAs(authTourist())
        ->get('/register')
        ->assertRedirect('/inicio');
});

test('authenticated home sends tourist to explore or profile setup', function () {
    $tourist = authTourist();

    $this->actingAs($tourist)
        ->get(route('authenticated.home'))
        ->assertRedirect(route('profile.setup'));
});
