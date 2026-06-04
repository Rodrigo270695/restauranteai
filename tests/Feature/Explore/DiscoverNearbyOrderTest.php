<?php

use App\Models\Restaurant;
use App\Models\RestaurantSchedule;
use App\Models\User;
use App\Services\GeoDistanceService;
use App\Services\RestaurantExploreService;
use App\Support\RestaurantHoursPresenter;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function exploreServiceWithDistances(): RestaurantExploreService
{
    $geo = Mockery::mock(GeoDistanceService::class);
    $geo->shouldReceive('kmBetween')
        ->andReturnUsing(function (float $lat, float $lng, float $rLat, float $rLng) {
            if ($rLng >= -79.841 && $rLng <= -79.839) {
                return match (true) {
                    $rLat >= -6.771 && $rLat <= -6.769 => 0.1,
                    $rLat >= -6.772 && $rLat <= -6.770 => 0.2,
                    $rLat >= -6.7715 && $rLat <= -6.7695 => 0.5,
                    default => 99.0,
                };
            }

            return match (true) {
                $rLat >= -6.771 && $rLat <= -6.769 => 0.5,
                $rLat >= -6.781 && $rLat <= -6.779 => 2.0,
                $rLat >= -6.791 && $rLat <= -6.789 => 5.0,
                default => 99.0,
            };
        });

    return new RestaurantExploreService($geo, new RestaurantHoursPresenter);
}

function discoverRestaurant(string $name, float $lat, float $lng, array $extra = []): Restaurant
{
    return Restaurant::create(array_merge([
        'owner_id' => User::factory()->create()->id,
        'name' => $name,
        'slug' => str($name)->slug()->toString().'-'.uniqid(),
        'latitude' => $lat,
        'longitude' => $lng,
        'is_active' => true,
        'is_verified' => true,
        'is_featured' => false,
        'avg_rating' => 4,
    ], $extra));
}

test('orderWithNearbyFirst puts closest venues first then editorial order', function () {
    $explore = exploreServiceWithDistances();

    $near = discoverRestaurant('Near', -6.77, -79.84);
    $mid = discoverRestaurant('Mid', -6.78, -79.85, ['is_featured' => true, 'avg_rating' => 5]);
    $far = discoverRestaurant('Far', -6.79, -79.86);
    $noCoords = discoverRestaurant('No GPS', 0, 0);
    $noCoords->update(['latitude' => null, 'longitude' => null]);

    $ordered = $explore->orderWithNearbyFirst(
        collect([$far, $noCoords, $mid, $near]),
        -6.7766,
        -79.8442,
        2,
    );

    expect($ordered->pluck('id')->all())->toBe([$near->id, $mid->id, $noCoords->id, $far->id]);
});

test('orderWithNearbyFirst prioritizes open venues before closer closed ones', function () {
    Carbon::setTestNow(Carbon::parse('2026-05-21 14:00:00', RestaurantHoursPresenter::TZ));

    $explore = exploreServiceWithDistances();

    $closedNear = discoverRestaurant('Closed near', -6.770, -79.84);
    RestaurantSchedule::create([
        'restaurant_id' => $closedNear->id,
        'day_of_week' => 3,
        'opens_at' => '08:00',
        'closes_at' => '12:00',
        'is_closed' => false,
    ]);

    $openFarther = discoverRestaurant('Open farther', -6.771, -79.84);
    RestaurantSchedule::create([
        'restaurant_id' => $openFarther->id,
        'day_of_week' => 3,
        'opens_at' => '08:00',
        'closes_at' => '22:00',
        'is_closed' => false,
    ]);

    $ordered = $explore->orderWithNearbyFirst(
        Restaurant::query()->whereIn('id', [$closedNear->id, $openFarther->id])->with('schedules')->get(),
        -6.7766,
        -79.8442,
        2,
    );

    expect($ordered->pluck('id')->all())->toBe([$openFarther->id, $closedNear->id]);
});

afterEach(function () {
    Carbon::setTestNow();
});
