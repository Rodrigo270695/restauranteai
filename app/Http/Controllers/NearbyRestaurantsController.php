<?php

namespace App\Http\Controllers;

use App\Services\RestaurantExploreService;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;

class NearbyRestaurantsController extends Controller
{
    public function __invoke(Request $request, RestaurantExploreService $explore): mixed
    {
        ['lat' => $userLat, 'lng' => $userLng] = $explore->parseUserCoordinates($request);

        $perPage = in_array((int) $request->input('per_page'), [9, 12, 15, 24], true)
            ? (int) $request->input('per_page')
            : 12;

        $page = max(1, $request->integer('page', 1));
        $baseQuery = $explore->publicQuery($request);

        $priceRanges = $explore->availablePriceRanges();
        $allowedPrices = collect($priceRanges)->pluck('value')->all();
        $priceRange = $request->string('price_range')->value() ?: null;
        if ($priceRange && ! in_array($priceRange, $allowedPrices, true)) {
            $priceRange = null;
        }

        $filters = [
            'search' => $request->string('search')->value(),
            'cuisine_type_id' => $request->integer('cuisine_type_id') ?: null,
            'price_range' => $priceRange,
            'district_id' => $request->integer('district_id') ?: null,
            'sort' => 'nearby',
            'lat' => $userLat,
            'lng' => $userLng,
            'location_active' => $userLat !== null && $userLng !== null,
        ];

        if ($userLat !== null && $userLng !== null) {
            $sorted = $explore->sortByDistance((clone $baseQuery)->get(), $userLat, $userLng);
            $total = $sorted->count();
            $slice = $sorted->slice(($page - 1) * $perPage, $perPage)->values();

            $paginator = new LengthAwarePaginator(
                $slice->map(fn ($r) => $explore->formatCard($r, $userLat, $userLng)),
                $total,
                $perPage,
                $page,
                ['path' => $request->url(), 'query' => $request->query()],
            );
        } else {
            $paginator = (clone $baseQuery)
                ->orderByDesc('is_featured')
                ->orderByDesc('avg_rating')
                ->paginate($perPage, ['*'], 'page', $page)
                ->withQueryString()
                ->through(fn ($r) => $explore->formatCard($r));
        }

        return Inertia::render('public/restaurants-nearby', [
            'restaurants' => $paginator,
            'cuisineTypes' => $explore->activeCuisines(),
            'districts' => $explore->districtsWithRestaurants(),
            'priceRanges' => $priceRanges,
            'filters' => $filters,
        ]);
    }
}
