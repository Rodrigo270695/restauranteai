<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\PaginatesPublicRestaurants;
use App\Services\RestaurantExploreService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NearbyRestaurantsController extends Controller
{
    use PaginatesPublicRestaurants;

    public function __invoke(Request $request, RestaurantExploreService $explore): mixed
    {
        ['lat' => $userLat, 'lng' => $userLng] = $explore->parseUserCoordinates($request);
        $locationActive = $request->boolean('location_active')
            && $userLat !== null
            && $userLng !== null;

        $perPage = in_array((int) $request->input('per_page'), [9, 12, 15, 24], true)
            ? (int) $request->input('per_page')
            : 12;

        $filters = $explore->resolvePublicFilters($request, [
            'sort' => $locationActive ? 'nearby' : 'featured',
            'location_active' => $locationActive,
        ]);

        if ($locationActive) {
            $filters['lat'] = $userLat;
            $filters['lng'] = $userLng;
        }

        $maxKm = (float) ($filters['max_distance_km'] ?? 50);

        if ($locationActive) {
            $sorted = $explore->sortByDistance(
                (clone $explore->publicQuery($request))->get(),
                $userLat,
                $userLng,
                $maxKm,
            );

            if ($filters['open_now']) {
                $sorted = $sorted
                    ->filter(fn ($r) => $explore->isRestaurantOpen($r))
                    ->values();
            }

            $paginator = $this->paginateSortedRestaurants(
                $request,
                $sorted,
                $perPage,
                fn ($r) => $explore->formatCard($r, $userLat, $userLng),
            );
        } else {
            $paginator = $this->paginatePublicRestaurants(
                $request,
                $explore,
                $perPage,
                fn ($r) => $explore->formatCard($r),
            );
        }

        return Inertia::render('public/restaurants-nearby', [
            'restaurants' => $paginator,
            'cuisineTypes' => $explore->activeCuisines(),
            'districts' => $explore->districtsWithRestaurants(),
            'ambiances' => $explore->activeAmbiances(),
            'priceRanges' => $explore->availablePriceRanges(),
            'filters' => $filters,
        ]);
    }
}
