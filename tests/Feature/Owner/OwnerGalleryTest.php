<?php

use App\Models\Restaurant;
use App\Models\RestaurantProfile;
use App\Models\User;
use App\Services\RestaurantScopeService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

function galleryOwnerWithRestaurant(): array
{
    $user = User::factory()->create();
    $user->assignRole('restaurant_owner');
    RestaurantProfile::create([
        'user_id' => $user->id,
        'business_name' => 'Sabor Peruano SAC',
        'phone' => '+51999999999',
        'address' => 'Av. Test 1',
        'description' => 'Restaurante demo',
        'status' => 'approved',
        'approved_at' => now(),
        'post_approval_completed_at' => now(),
    ]);
    $restaurant = Restaurant::create([
        'owner_id' => $user->id,
        'name' => 'Sabor Peruano',
        'slug' => 'sabor-peruano-'.$user->id,
        'is_active' => true,
    ]);

    return [$user, $restaurant];
}

test('restaurant owner can open gallery even without manage_gallery permission', function () {
    [$user] = galleryOwnerWithRestaurant();
    $user->revokePermissionTo('manage_gallery');

    $this->actingAs($user)
        ->get(route('app.gallery'))
        ->assertOk();
});

test('super admin impersonating can open owner gallery', function () {
    [$owner, $restaurant] = galleryOwnerWithRestaurant();
    $admin = User::factory()->create();
    $admin->assignRole('super_admin');

    $this->actingAs($admin)
        ->withSession([RestaurantScopeService::ACTING_SESSION_KEY => $restaurant->id])
        ->get(route('app.gallery'))
        ->assertOk();
});

test('super admin can open admin gallery route for a restaurant', function () {
    [, $restaurant] = galleryOwnerWithRestaurant();
    $admin = User::factory()->create();
    $admin->assignRole('super_admin');

    $this->actingAs($admin)
        ->get(route('app.admin.restaurants.manage.gallery', $restaurant))
        ->assertOk();
});

test('super admin can delete gallery image via admin post route', function () {
    [, $restaurant] = galleryOwnerWithRestaurant();
    $admin = User::factory()->create();
    $admin->assignRole('super_admin');

    $image = $restaurant->images()->create([
        'path' => 'restaurants/test/admin-delete.jpg',
        'type' => 'interior',
        'display_order' => 0,
        'is_cover' => false,
    ]);

    $this->actingAs($admin)
        ->post(route('app.admin.restaurants.manage.gallery.unlink', [$restaurant, $image]))
        ->assertRedirect();

    expect($restaurant->images()->whereKey($image->id)->exists())->toBeFalse();
});

test('super admin can delete gallery without restaurants view permission', function () {
    [, $restaurant] = galleryOwnerWithRestaurant();
    $admin = User::factory()->create();
    $admin->assignRole('super_admin');
    $admin->revokePermissionTo('restaurants.view');

    $image = $restaurant->images()->create([
        'path' => 'restaurants/test/admin-no-perm.jpg',
        'type' => 'interior',
        'display_order' => 0,
        'is_cover' => false,
    ]);

    $this->actingAs($admin)
        ->post(route('app.admin.restaurants.manage.gallery.unlink', [$restaurant, $image]))
        ->assertRedirect();

    expect($restaurant->images()->whereKey($image->id)->exists())->toBeFalse();
});

test('super admin impersonating can delete gallery image via unlink route', function () {
    [, $restaurant] = galleryOwnerWithRestaurant();
    $admin = User::factory()->create();
    $admin->assignRole('super_admin');
    $admin->revokePermissionTo('restaurants.view');

    $image = $restaurant->images()->create([
        'path' => 'restaurants/test/acting-unlink.jpg',
        'type' => 'interior',
        'display_order' => 0,
        'is_cover' => false,
    ]);

    $this->actingAs($admin)
        ->withSession([RestaurantScopeService::ACTING_SESSION_KEY => $restaurant->id])
        ->post(route('app.gallery.unlink', $image))
        ->assertRedirect();

    expect($restaurant->images()->whereKey($image->id)->exists())->toBeFalse();
});

test('super admin impersonating can delete gallery image via method spoof', function () {
    [, $restaurant] = galleryOwnerWithRestaurant();
    $admin = User::factory()->create();
    $admin->assignRole('super_admin');

    $image = $restaurant->images()->create([
        'path' => 'restaurants/test/acting-spoof.jpg',
        'type' => 'interior',
        'display_order' => 0,
        'is_cover' => false,
    ]);

    $this->actingAs($admin)
        ->withSession([RestaurantScopeService::ACTING_SESSION_KEY => $restaurant->id])
        ->delete(route('app.gallery.destroy', $image))
        ->assertRedirect();

    expect($restaurant->images()->whereKey($image->id)->exists())->toBeFalse();
});

test('owner can delete gallery image via empty post to gallery id', function () {
    [$user, $restaurant] = galleryOwnerWithRestaurant();
    $user->revokePermissionTo('manage_gallery');

    $image = $restaurant->images()->create([
        'path' => 'restaurants/test/empty-post.jpg',
        'type' => 'interior',
        'display_order' => 0,
        'is_cover' => false,
    ]);

    $this->actingAs($user)
        ->post(route('app.gallery.destroy.post', $image), [])
        ->assertRedirect();

    expect($restaurant->images()->whereKey($image->id)->exists())->toBeFalse();
});

test('owner can delete gallery image via legacy post with method delete', function () {
    [$user, $restaurant] = galleryOwnerWithRestaurant();
    $user->revokePermissionTo('manage_gallery');

    $image = $restaurant->images()->create([
        'path' => 'restaurants/test/legacy-delete.jpg',
        'type' => 'interior',
        'display_order' => 0,
        'is_cover' => false,
    ]);

    $this->actingAs($user)
        ->withHeaders(['X-Inertia' => 'true', 'X-Requested-With' => 'XMLHttpRequest'])
        ->post(route('app.gallery.destroy.post', $image), ['_method' => 'delete'])
        ->assertRedirect();

    expect($restaurant->images()->whereKey($image->id)->exists())->toBeFalse();
});

test('owner can update gallery image via post update route', function () {
    [$user, $restaurant] = galleryOwnerWithRestaurant();
    $user->revokePermissionTo('manage_gallery');

    $image = $restaurant->images()->create([
        'path' => 'restaurants/test/update-post.jpg',
        'type' => 'interior',
        'display_order' => 0,
        'is_cover' => false,
        'alt_text' => 'Antes',
    ]);

    $this->actingAs($user)
        ->post(route('app.gallery.update.post', $image), [
            'alt_text' => 'Después',
            'type' => 'ambiente',
        ])
        ->assertRedirect();

    expect($image->fresh()->alt_text)->toBe('Después');
    expect($image->fresh()->type)->toBe('ambiente');
});
