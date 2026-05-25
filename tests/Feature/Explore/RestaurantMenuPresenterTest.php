<?php

use App\Models\Dish;
use App\Models\DishCategory;
use App\Models\Restaurant;
use App\Models\User;
use App\Support\RestaurantMenuPresenter;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('menu presenter groups dishes by category', function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(CatalogSeeder::class);

    $owner = User::factory()->create();

    $bebidas = DishCategory::where('slug', 'bebidas')->first();
    $fondos = DishCategory::where('slug', 'platos-de-fondo')->first();

    $restaurant = Restaurant::create([
        'owner_id' => $owner->id,
        'name' => 'Test',
        'slug' => 'test-menu',
        'price_range' => 'moderado',
    ]);

    Dish::create([
        'restaurant_id' => $restaurant->id,
        'dish_category_id' => $fondos->id,
        'name' => 'Seco',
        'description' => 'Plato de fondo demo',
        'price' => 30,
        'is_available' => true,
        'display_order' => 1,
    ]);

    Dish::create([
        'restaurant_id' => $restaurant->id,
        'dish_category_id' => $bebidas->id,
        'name' => 'Chicha',
        'description' => 'Bebida tradicional',
        'price' => 8,
        'is_available' => true,
        'display_order' => 1,
    ]);

    $menu = RestaurantMenuPresenter::forRestaurant($restaurant);

    expect($menu['total_items'])->toBe(2);
    expect($menu['sections'])->toHaveCount(2);
    expect($menu['sections'][0]['slug'])->toBe('platos-de-fondo');
    expect($menu['sections'][1]['slug'])->toBe('bebidas');
    expect($menu['sections'][0]['items'][0]['description'])->toBe('Plato de fondo demo');
});
