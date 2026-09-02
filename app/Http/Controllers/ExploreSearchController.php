<?php

namespace App\Http\Controllers;

use App\Services\RestaurantExploreService;
use App\Services\UserInteractionService;
use App\Support\PriceRange;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExploreSearchController extends Controller
{
    private const PER_PAGE = 8;

    public function __invoke(
        Request $request,
        RestaurantExploreService $explore,
        UserInteractionService $interactions,
    ): mixed {
        $user = $request->user();
        ['lat' => $userLat, 'lng' => $userLng] = $explore->parseUserCoordinates($request);
        $locationActive = $userLat !== null && $userLng !== null;

        $favoritedIds = $user?->hasRole('tourist')
            ? $interactions->favoritedRestaurantIds($user)
            : [];
        $query = $explore->publicQuery($request);

        $sort = $request->string('sort')->value() ?: 'relevant';
        if (! in_array($sort, ['relevant', 'rating', 'distance', 'name'], true)) {
            $sort = 'relevant';
        }

        if ($sort === 'rating') {
            $query->reorder()->orderByDesc('avg_rating');
        } elseif ($sort === 'name') {
            $query->reorder()->orderBy('name');
        } elseif ($locationActive && in_array($sort, ['distance', 'relevant'], true)) {
            $explore->applyDistanceOrder($query, $userLat, $userLng);
        }

        $page = max(1, (int) $request->integer('page') ?: 1);
        $paginator = $query->paginate(self::PER_PAGE, ['*'], 'page', $page);
        $pageItems = collect($paginator->items());

        $favoritedSet = array_fill_keys($favoritedIds, true);
        $formatted = $pageItems->map(fn ($r) => array_merge(
            $explore->formatCard($r, $userLat, $userLng),
            ['is_favorited' => isset($favoritedSet[$r->id])],
        ));

        $cuisineIds = $explore->intList($request, 'cuisine_type_ids');
        if ($cuisineIds === [] && $request->integer('cuisine_type_id')) {
            $cuisineIds = [$request->integer('cuisine_type_id')];
        }

        $priceRanges = $explore->stringList($request, 'price_ranges');
        if ($priceRanges === [] && $request->string('price_range')->value()) {
            $priceRanges = [$request->string('price_range')->value()];
        }
        $priceRanges = array_values(array_filter(
            $priceRanges,
            fn (string $v) => in_array($v, PriceRange::VALUES, true),
        ));

        $partialData = $request->header('X-Inertia-Partial-Data', '');
        $filterPartial = $partialData !== '' && empty(array_diff(
            array_filter(array_map(trim(...), explode(',', $partialData))),
            ['restaurants', 'filters', 'pagination'],
        ));

        $payload = [
            'restaurants' => $formatted,
            'filters' => [
                'search' => $request->string('search')->value(),
                'cuisine_type_ids' => $cuisineIds,
                'price_ranges' => $priceRanges,
                'ambiance_ids' => $explore->intList($request, 'ambiance_ids'),
                'restaurant_environment_ids' => $explore->intList($request, 'restaurant_environment_ids'),
                'party_type_ids' => $explore->intList($request, 'party_type_ids'),
                'district_id' => $request->integer('district_id') ?: null,
                'sort' => $sort,
                'page' => $paginator->currentPage(),
                'lat' => $userLat,
                'lng' => $userLng,
                'location_active' => $locationActive,
            ],
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];

        if ($filterPartial) {
            return Inertia::render('explore/search/index', $payload);
        }

        return Inertia::render('explore/search/index', [
            ...$payload,
            'catalogs' => [
                'cuisineTypes' => $explore->activeCuisines(),
                'priceRanges' => $explore->availablePriceRanges(),
                'ambiances' => $explore->activeAmbiances(),
                'environments' => $explore->activeRestaurantEnvironments(),
                'partyTypes' => $explore->activePartyTypes(),
                'districts' => $explore->districtsWithRestaurants(),
            ],
        ]);
    }
}
