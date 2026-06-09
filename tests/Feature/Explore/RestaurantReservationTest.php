<?php

use App\Models\CuisineType;
use App\Models\Department;
use App\Models\District;
use App\Models\Province;
use App\Models\Restaurant;
use App\Models\RestaurantProfile;
use App\Models\RestaurantReservation;
use App\Models\RestaurantSchedule;
use App\Models\Review;
use App\Models\TouristRoute;
use App\Models\User;
use App\Services\RestaurantReservationService;
use App\Support\RestaurantHoursPresenter;
use Carbon\Carbon;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    Carbon::setTestNow(Carbon::parse('2026-05-18 14:00:00', RestaurantHoursPresenter::TZ));
});

afterEach(function () {
    Carbon::setTestNow();
});

function reservationTourist(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('tourist');

    return $user;
}

function reservationRestaurant(): Restaurant
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

    $restaurant = Restaurant::create([
        'owner_id' => User::factory()->create()->id,
        'district_id' => $dist->id,
        'cuisine_type_id' => $cuisine->id,
        'name' => 'Cevichería Reserva',
        'slug' => 'cevicheria-reserva-'.uniqid(),
        'latitude' => -6.77,
        'longitude' => -79.84,
        'price_range' => 'moderado',
        'is_active' => true,
        'is_verified' => true,
    ]);

    foreach (range(0, 6) as $day) {
        RestaurantSchedule::create([
            'restaurant_id' => $restaurant->id,
            'day_of_week' => $day,
            'opens_at' => '11:00',
            'closes_at' => '22:00',
            'is_closed' => false,
        ]);
    }

    return $restaurant;
}

function activeRouteWithStop(User $user, Restaurant $restaurant): TouristRoute
{
    $route = TouristRoute::create([
        'user_id' => $user->id,
        'name' => 'Ruta test',
        'slug' => 'ruta-test-'.uniqid(),
        'status' => 'active',
        'route_date' => now()->addDay()->toDateString(),
    ]);

    $route->stops()->create([
        'restaurant_id' => $restaurant->id,
        'position' => 1,
    ]);

    return $route->fresh(['stops']);
}

test('tourist reservation flow enables review after visit', function () {
    $user = reservationTourist();
    $restaurant = reservationRestaurant();
    $route = activeRouteWithStop($user, $restaurant);
    $reservedFor = now()->addHours(2)->format('Y-m-d H:i:s');

    $this->actingAs($user)
        ->post(route('explore.routes.reservations.store', [$route->slug, $restaurant->slug]), [
            'reserved_for' => str_replace(' ', 'T', $reservedFor),
            'party_size' => 2,
        ])
        ->assertRedirect();

    $reservation = RestaurantReservation::query()->first();
    expect($reservation)->not->toBeNull()
        ->and($reservation->status)->toBe(RestaurantReservation::STATUS_PENDING);

    $owner = User::factory()->create(['email_verified_at' => now()]);
    $owner->assignRole('restaurant_owner');
    RestaurantProfile::create([
        'user_id' => $owner->id,
        'business_name' => 'Mar y Tierra SAC',
        'phone' => '+51999999999',
        'address' => 'Chiclayo',
        'description' => 'Local demo',
        'status' => 'approved',
        'approved_at' => now(),
        'post_approval_completed_at' => now(),
    ]);
    $restaurant->update(['owner_id' => $owner->id]);

    $this->actingAs($owner)
        ->post(route('app.reservations.confirm', $reservation))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($reservation->fresh()->status)->toBe(RestaurantReservation::STATUS_CONFIRMED);

    $this->actingAs($user)
        ->post(route('explore.reservations.visited', $reservation))
        ->assertRedirect();

    expect($reservation->fresh()->status)->toBe(RestaurantReservation::STATUS_VISITED);

    $this->actingAs($user)
        ->post(route('explore.restaurants.reviews', $restaurant->slug), [
            'rating' => 5,
            'comment' => 'Excelente ceviche',
        ])
        ->assertRedirect();

    expect(Review::query()->where('user_id', $user->id)->where('restaurant_id', $restaurant->id)->exists())->toBeTrue();
    expect((float) $restaurant->fresh()->avg_rating)->toBe(5.0);

    $formatted = app(RestaurantReservationService::class)
        ->formatReservation($reservation->fresh(), $user);

    expect($formatted['has_review'])->toBeTrue()
        ->and($formatted['can_review'])->toBeFalse();
});

test('reservation datetimes are exposed in America Lima timezone', function () {
    $user = reservationTourist();
    $restaurant = reservationRestaurant();
    $route = activeRouteWithStop($user, $restaurant);

    $this->actingAs($user)
        ->post(route('explore.routes.reservations.store', [$route->slug, $restaurant->slug]), [
            'reserved_for' => '2026-06-09T19:00',
            'party_size' => 2,
        ])
        ->assertRedirect();

    $reservation = RestaurantReservation::query()->firstOrFail();
    $formatted = app(RestaurantReservationService::class)
        ->formatReservation($reservation, $user);

    expect($formatted['reserved_for'])->toBe('2026-06-09T19:00:00-05:00')
        ->and($reservation->fresh()->reserved_for->utc()->format('Y-m-d H:i:s'))->toBe('2026-06-10 00:00:00');
});

test('tourist cannot review without visited reservation', function () {
    $user = reservationTourist();
    $restaurant = reservationRestaurant();

    $this->actingAs($user)
        ->post(route('explore.restaurants.reviews', $restaurant->slug), [
            'rating' => 4,
        ])
        ->assertSessionHasErrors('rating');
});
