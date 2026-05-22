<?php

use App\Services\GeoDistanceService;
use App\Services\StreetRoutingService;
use Illuminate\Support\Facades\Http;

test('street routing returns path along roads from osrm', function () {
    Http::fake([
        'router.project-osrm.org/*' => Http::response([
            'routes' => [
                [
                    'distance' => 2500,
                    'duration' => 1800,
                    'geometry' => [
                        'coordinates' => [
                            [-79.84, -6.77],
                            [-79.841, -6.771],
                            [-79.842, -6.772],
                        ],
                    ],
                ],
            ],
        ]),
    ]);

    $service = new StreetRoutingService(new GeoDistanceService);

    $stats = $service->routeStats([
        ['lat' => -6.77, 'lng' => -79.84],
        ['lat' => -6.772, 'lng' => -79.842],
    ]);

    expect($stats)->not->toBeNull();
    expect($stats['distance_km'])->toBe(2.5);
    expect($stats['path'])->toHaveCount(3);
    expect($stats['path'][0])->toBe([-6.77, -79.84]);
});

test('street routing falls back when osrm fails', function () {
    Http::fake([
        'router.project-osrm.org/*' => Http::response([], 500),
    ]);

    $service = new StreetRoutingService(new GeoDistanceService);

    $stats = $service->routeStatsWithFallback([
        ['lat' => -6.77, 'lng' => -79.84],
        ['lat' => -6.78, 'lng' => -79.85],
    ]);

    expect($stats['path'])->toHaveCount(2);
    expect($stats['distance_km'])->toBeGreaterThan(0);
});
