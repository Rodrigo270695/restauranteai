<?php

use App\Models\Restaurant;
use App\Models\User;
use App\Models\UserInteraction;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('public page shows restaurant with most interactions', function () {
    $owner = User::factory()->create();
    $a = Restaurant::create([
        'owner_id' => $owner->id,
        'name' => 'Local A',
        'slug' => 'local-a',
        'price_range' => 'moderado',
    ]);
    $b = Restaurant::create([
        'owner_id' => $owner->id,
        'name' => 'Local B',
        'slug' => 'local-b',
        'price_range' => 'moderado',
    ]);
    $user = User::factory()->create();

    UserInteraction::create(['user_id' => $user->id, 'restaurant_id' => $a->id, 'interaction_type' => 'click']);
    UserInteraction::create(['user_id' => $user->id, 'restaurant_id' => $b->id, 'interaction_type' => 'view']);
    UserInteraction::create(['user_id' => $user->id, 'restaurant_id' => $b->id, 'interaction_type' => 'save']);

    $this->get(route('restaurants.interactions.top'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('public/top-interactions')
            ->where('leader.name', 'Local B')
            ->where('leader.interactions', 2)
            ->has('ranking', 2));
});
