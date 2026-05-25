<?php

use App\Models\Ambiance;
use App\Models\CuisineType;
use App\Models\DietaryOption;
use App\Models\DishCategory;
use App\Models\PartyType;
use App\Models\Service;
use App\Models\SupportLanguage;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

function superAdminUser(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('super_admin');

    return $user;
}

test('super admin can update cuisine type from catalog route', function () {
    $user = superAdminUser();
    $item = CuisineType::create([
        'name' => 'Ceviche',
        'slug' => 'ceviche',
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->put("/app/admin/cuisine-types/{$item->id}", [
        'name' => 'Ceviche actualizado',
        'slug' => 'ceviche-actualizado',
        'is_active' => true,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');
    expect($item->fresh()->name)->toBe('Ceviche actualizado');
});

test('all admin catalog resources accept update with string route id', function (string $path, string $catalogKey, string $modelClass) {
    $user = superAdminUser();
    $item = $modelClass::create(match ($catalogKey) {
        'languages' => ['name' => 'Español', 'code' => 'es', 'is_active' => true],
        'dish_categories' => ['name' => 'Entradas', 'slug' => 'entradas', 'is_active' => true],
        default => ['name' => 'Item test', 'slug' => 'item-test', 'is_active' => true],
    });

    $payload = match ($catalogKey) {
        'languages' => ['name' => 'Español OK', 'code' => 'es', 'is_active' => true],
        'dish_categories' => ['name' => 'Entradas OK', 'slug' => 'entradas-ok', 'is_active' => true],
        default => ['name' => 'Item OK', 'slug' => 'item-ok', 'is_active' => true],
    };

    $response = $this->actingAs($user)->put("/app/admin/{$path}/{$item->id}", $payload);

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();
    expect($item->fresh()->name)->toBe($payload['name']);
})->with([
    ['cuisine-types', 'cuisine_types', CuisineType::class],
    ['ambiances', 'ambiances', Ambiance::class],
    ['services', 'services', Service::class],
    ['dish-categories', 'dish_categories', DishCategory::class],
    ['support-languages', 'languages', SupportLanguage::class],
    ['party-types', 'party_types', PartyType::class],
    ['dietary-options', 'dietary_options', DietaryOption::class],
]);
