<?php

use App\Models\Restaurant;
use App\Models\RestaurantSchedule;
use App\Models\User;
use App\Support\RestaurantHoursPresenter;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function hoursRestaurant(): Restaurant
{
    return Restaurant::create([
        'owner_id' => User::factory()->create()->id,
        'name' => 'Horarios Test',
        'slug' => 'horarios-test',
        'is_active' => true,
        'is_verified' => true,
    ]);
}

test('shows open until close time when inside business hours', function () {
    $restaurant = hoursRestaurant();
    foreach (range(0, 6) as $day) {
        RestaurantSchedule::create([
            'restaurant_id' => $restaurant->id,
            'day_of_week' => $day,
            'opens_at' => '11:00',
            'closes_at' => '22:00',
            'is_closed' => false,
        ]);
    }

    $monday20 = Carbon::parse('2026-05-18 20:00:00', RestaurantHoursPresenter::TZ);
    $status = (new RestaurantHoursPresenter)->forRestaurant($restaurant, $monday20);

    expect($status['is_open'])->toBeTrue()
        ->and($status['label'])->toBe('Abierto hasta las 10:00 p. m.')
        ->and($status['closes_soon'])->toBeFalse()
        ->and($status['minutes_until_close'])->toBe(120);
});

test('shows closing soon in red threshold when under thirty minutes', function () {
    $restaurant = hoursRestaurant();
    RestaurantSchedule::create([
        'restaurant_id' => $restaurant->id,
        'day_of_week' => 0,
        'opens_at' => '11:00',
        'closes_at' => '22:00',
        'is_closed' => false,
    ]);

    $monday2135 = Carbon::parse('2026-05-18 21:35:00', RestaurantHoursPresenter::TZ);
    $status = (new RestaurantHoursPresenter)->forRestaurant($restaurant, $monday2135);

    expect($status['is_open'])->toBeTrue()
        ->and($status['closes_soon'])->toBeTrue()
        ->and($status['label'])->toBe('Cierra en 25 minutos')
        ->and($status['minutes_until_close'])->toBe(25);
});

test('shows closed before opening time', function () {
    $restaurant = hoursRestaurant();
    RestaurantSchedule::create([
        'restaurant_id' => $restaurant->id,
        'day_of_week' => 0,
        'opens_at' => '11:00',
        'closes_at' => '22:00',
        'is_closed' => false,
    ]);

    $monday09 = Carbon::parse('2026-05-18 09:00:00', RestaurantHoursPresenter::TZ);
    $status = (new RestaurantHoursPresenter)->forRestaurant($restaurant, $monday09);

    expect($status['is_open'])->toBeFalse()
        ->and($status['label'])->toBe('Abre a las 11:00 a. m.');
});

test('welcome card includes hours payload', function () {
    $restaurant = hoursRestaurant();
    RestaurantSchedule::create([
        'restaurant_id' => $restaurant->id,
        'day_of_week' => Carbon::now(RestaurantHoursPresenter::TZ)->isoWeekday() - 1,
        'opens_at' => '11:00',
        'closes_at' => '22:00',
        'is_closed' => false,
    ]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('restaurants.data.0.hours')
            ->where('restaurants.data.0.hours.is_open', true));
});
