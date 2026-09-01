<?php

use App\Models\CuisineType;
use App\Models\District;
use App\Models\Province;
use App\Models\Restaurant;
use App\Models\RestaurantSchedule;
use App\Models\TouristRoute;
use App\Models\User;
use App\Models\Department;
use App\Support\RestaurantHoursPresenter;
use Carbon\Carbon;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

function tourist(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('tourist');

    return $user;
}

function verifiedRestaurant(array $overrides = []): Restaurant
{
    $dept = Department::firstOrCreate(['code' => '14'], ['name' => 'Lambayeque']);
    $prov = Province::firstOrCreate(
        ['code' => '1401'],
        ['name' => 'Chiclayo', 'department_id' => $dept->id],
    );
    $dist = District::firstOrCreate(
        ['code' => '140101'],
        ['name' => 'Chiclayo', 'province_id' => $prov->id],
    );
    $cuisine = CuisineType::firstOrCreate(
        ['slug' => 'ceviche'],
        ['name' => 'Ceviche', 'is_active' => true],
    );

    $slug = $overrides['slug'] ?? 'cevicheria-test-'.uniqid();

    return Restaurant::create(array_merge([
        'owner_id' => User::factory()->create()->id,
        'district_id' => $dist->id,
        'cuisine_type_id' => $cuisine->id,
        'name' => 'Cevichería Test',
        'slug' => $slug,
        'latitude' => -6.77,
        'longitude' => -79.84,
        'price_range' => 'moderado',
        'is_active' => true,
        'is_verified' => true,
    ], $overrides));
}

test('tourist can open discover with restaurants', function () {
    verifiedRestaurant();

    $this->actingAs(tourist())
        ->get(route('explore.discover'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('explore/discover/index')
            ->has('restaurants', 1));
});

test('tourist cannot add closed restaurant to route', function () {
    Carbon::setTestNow(Carbon::parse('2026-05-18 23:30:00', RestaurantHoursPresenter::TZ));

    $restaurant = verifiedRestaurant(['slug' => 'cerrado-test']);
    foreach (range(0, 6) as $day) {
        RestaurantSchedule::create([
            'restaurant_id' => $restaurant->id,
            'day_of_week' => $day,
            'opens_at' => '11:00',
            'closes_at' => '22:00',
            'is_closed' => false,
        ]);
    }

    $this->actingAs(tourist())
        ->from(route('explore.discover'))
        ->post(route('explore.routes.stops.add', $restaurant->slug))
        ->assertRedirect(route('explore.discover'))
        ->assertSessionHasErrors('restaurant');

    Carbon::setTestNow();
});

test('tourist can build and publish a route', function () {
    Carbon::setTestNow(Carbon::parse('2026-05-18 14:00:00', RestaurantHoursPresenter::TZ));

    $user = tourist();
    $r1 = verifiedRestaurant(['slug' => 'cevicheria-uno']);
    $r2 = verifiedRestaurant(['name' => 'Segundo', 'slug' => 'cevicheria-dos']);

    foreach ([$r1, $r2] as $restaurant) {
        foreach (range(0, 6) as $day) {
            RestaurantSchedule::create([
                'restaurant_id' => $restaurant->id,
                'day_of_week' => $day,
                'opens_at' => '11:00',
                'closes_at' => '22:00',
                'is_closed' => false,
            ]);
        }
    }

    $this->actingAs($user)->post(route('explore.routes.stops.add', $r1->slug))->assertRedirect();
    $this->actingAs($user)->post(route('explore.routes.stops.add', $r2->slug))->assertRedirect();

    $this->actingAs($user)
        ->post(route('explore.routes.publish'), ['name' => 'Ruta Ceviche'])
        ->assertRedirect();

    $route = TouristRoute::where('user_id', $user->id)->where('status', 'active')->first();
    expect($route)->not->toBeNull();
    expect($route->route_date)->not->toBeNull();

    $this->actingAs($user)
        ->post(route('explore.routes.complete', $route))
        ->assertRedirect(route('explore.routes.index'));

    expect($route->fresh()->completed_at)->not->toBeNull();

    Carbon::setTestNow();
});

test('tourist can reorder draft route stops', function () {
    Carbon::setTestNow(Carbon::parse('2026-05-18 14:00:00', RestaurantHoursPresenter::TZ));

    $user = tourist();
    $r1 = verifiedRestaurant(['slug' => 'primero-orden']);
    $r2 = verifiedRestaurant(['name' => 'Segundo', 'slug' => 'segundo-orden']);

    foreach ([$r1, $r2] as $restaurant) {
        foreach (range(0, 6) as $day) {
            RestaurantSchedule::create([
                'restaurant_id' => $restaurant->id,
                'day_of_week' => $day,
                'opens_at' => '11:00',
                'closes_at' => '22:00',
                'is_closed' => false,
            ]);
        }
    }

    $this->actingAs($user)->post(route('explore.routes.stops.add', $r1->slug))->assertRedirect();
    $this->actingAs($user)->post(route('explore.routes.stops.add', $r2->slug))->assertRedirect();

    $this->actingAs($user)
        ->put(route('explore.routes.stops.reorder'), ['slugs' => [$r2->slug, $r1->slug]])
        ->assertRedirect();

    $draft = TouristRoute::where('user_id', $user->id)->where('status', 'draft')->first();
    $ordered = $draft->stops()->orderBy('position')->with('restaurant')->get();

    expect($ordered[0]->restaurant->slug)->toBe($r2->slug);
    expect($ordered[1]->restaurant->slug)->toBe($r1->slug);

    Carbon::setTestNow();
});

test('tourist can favorite a published route and see it in favorites', function () {
    Carbon::setTestNow(Carbon::parse('2026-05-18 14:00:00', RestaurantHoursPresenter::TZ));

    $user = tourist();
    $restaurant = verifiedRestaurant(['slug' => 'fav-route-local']);
    foreach (range(0, 6) as $day) {
        RestaurantSchedule::create([
            'restaurant_id' => $restaurant->id,
            'day_of_week' => $day,
            'opens_at' => '11:00',
            'closes_at' => '22:00',
            'is_closed' => false,
        ]);
    }

    $this->actingAs($user)->post(route('explore.routes.stops.add', $restaurant->slug))->assertRedirect();
    $this->actingAs($user)->post(route('explore.routes.publish'), ['name' => 'Ruta favorita'])->assertRedirect();

    $route = TouristRoute::where('user_id', $user->id)->where('status', 'active')->first();
    expect($route)->not->toBeNull();

    $this->actingAs($user)
        ->post(route('explore.favorites.routes.toggle', $route->slug))
        ->assertRedirect();

    $this->actingAs($user)
        ->get(route('explore.favorites', ['tab' => 'routes']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('explore/favorites/index')
            ->has('routes', 1)
            ->where('routes.0.slug', $route->slug)
            ->where('tab', 'routes'));

    Carbon::setTestNow();
});
