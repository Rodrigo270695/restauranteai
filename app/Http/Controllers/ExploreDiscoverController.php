<?php

namespace App\Http\Controllers;

use App\Services\RestaurantExploreService;
use App\Services\TouristRouteService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class ExploreDiscoverController extends Controller
{
    public function __invoke(
        Request $request,
        RestaurantExploreService $explore,
        TouristRouteService $routes,
    ): mixed {
        if (! $request->user()?->hasRole('tourist')) {
            return Redirect::route('dashboard');
        }

        $user = $request->user();
        ['lat' => $userLat, 'lng' => $userLng] = $explore->parseUserCoordinates($request);
        $locationActive = $userLat !== null && $userLng !== null;
        $nearbyLimit = 30;

        $restaurants = $explore->publicQuery($request)->get();

        if ($locationActive) {
            $restaurants = $explore->orderWithNearbyFirst($restaurants, $userLat, $userLng, $nearbyLimit);
        }
        $draftModel = $routes->draftFor($user);
        $pathPoints = count($draftModel->path_coordinates ?? []);
        if ($draftModel->stops()->count() >= 2 && $pathPoints <= $draftModel->stops()->count()) {
            $draftModel = $routes->refreshMetrics($draftModel);
        }
        $draft = $routes->formatRoute($draftModel);
        $draftStopSlugs = collect($draft['stops'] ?? [])
            ->map(fn ($s) => $s['restaurant']['slug'] ?? null)
            ->filter()
            ->values()
            ->all();

        return Inertia::render('explore/discover/index', [
            'restaurants' => $restaurants->map(fn ($r) => $explore->formatCard($r, $userLat, $userLng)),
            'markers' => $explore->mapMarkers($restaurants)->values(),
            'cuisineTypes' => $explore->activeCuisines(),
            'filters' => [
                'search' => $request->string('search')->value(),
                'cuisine_type_id' => $request->integer('cuisine_type_id') ?: null,
                'price_range' => $request->string('price_range')->value() ?: null,
                'view' => $request->string('view')->value() === 'list' ? 'list' : 'map',
                'lat' => $userLat,
                'lng' => $userLng,
                'location_active' => $locationActive,
            ],
            'nearbyLimit' => $nearbyLimit,
            'draftRoute' => $draft,
            'draftStopSlugs' => $draftStopSlugs,
            'mapCenter' => $locationActive
                ? ['lat' => $userLat, 'lng' => $userLng]
                : ['lat' => -6.7766, 'lng' => -79.8442],
        ]);
    }
}
