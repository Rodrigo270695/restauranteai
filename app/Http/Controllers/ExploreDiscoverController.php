<?php

namespace App\Http\Controllers;

use App\Models\TouristRoute;
use App\Models\TouristRouteStop;
use App\Models\User;
use App\Services\RestaurantExploreService;
use App\Services\TouristRouteService;
use App\Services\UserInteractionService;
use App\Support\PriceRange;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class ExploreDiscoverController extends Controller
{
    private const PER_PAGE = 8;

    public function __invoke(
        Request $request,
        RestaurantExploreService $explore,
        TouristRouteService $routes,
        UserInteractionService $interactions,
    ): mixed {
        if (! $request->user()?->hasRole('tourist')) {
            return Redirect::route('dashboard');
        }

        $user = $request->user();
        $partialKeys = $this->partialDataKeys($request);

        if ($partialKeys !== [] && $this->wantsDraftOnly($partialKeys)) {
            return Inertia::render('explore/discover/index', $this->draftPayload($user, $routes));
        }

        $filterPartial = $this->wantsFilterPartial($partialKeys);

        ['lat' => $userLat, 'lng' => $userLng] = $explore->parseUserCoordinates($request);
        $locationActive = $userLat !== null && $userLng !== null;
        $nearbyLimit = 30;

        $favoritesOnly = $request->boolean('favorites_only');
        $favoritedIds = $interactions->favoritedRestaurantIds($user);

        $query = $explore->publicQuery($request);

        if ($favoritesOnly) {
            $query->whereIn('id', $favoritedIds !== [] ? $favoritedIds : [0]);
        }

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

        $markerModels = $query->clone()
            ->setEagerLoads([])
            ->limit($nearbyLimit)
            ->get();

        $paginator = $query->paginate(self::PER_PAGE, ['*'], 'page', $page);
        $pageItems = collect($paginator->items());

        if ($request->boolean('open_now')) {
            $pageItems = $explore->filterOpenNow($pageItems);
        }

        $favoritedSet = array_fill_keys($favoritedIds, true);
        $formatted = $pageItems->map(fn ($r) => array_merge(
            $explore->formatCard($r, $userLat, $userLng),
            ['is_favorited' => isset($favoritedSet[$r->id])],
        ));

        $filters = $this->discoverFilters($request, $explore, $userLat, $userLng, $locationActive, $favoritesOnly, $sort, $paginator->currentPage());

        $draftStopRestaurantIds = $filterPartial
            ? $this->draftStopRestaurantIds($user)
            : $routes->draftFor($user)->stops()->pluck('restaurant_id')->all();

        $payload = [
            'restaurants' => $formatted,
            'favoritesCount' => count($favoritedIds),
            'markers' => $explore->mapMarkersForDiscover(
                $markerModels,
                $nearbyLimit,
                $userLat,
                $userLng,
                $draftStopRestaurantIds,
            )->values(),
            'filters' => $filters,
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'nearbyLimit' => $nearbyLimit,
        ];

        if ($filterPartial) {
            return Inertia::render('explore/discover/index', $payload);
        }

        $draftModel = $routes->draftFor($user);

        return Inertia::render('explore/discover/index', [
            ...$payload,
            'catalogs' => [
                'cuisineTypes' => $explore->activeCuisines(),
                'priceRanges' => $explore->availablePriceRanges(),
                'ambiances' => $explore->activeAmbiances(),
                'environments' => $explore->activeRestaurantEnvironments(),
                'partyTypes' => $explore->activePartyTypes(),
                'districts' => $explore->districtsWithRestaurants(),
            ],
            ...$this->draftPayload($user, $routes, $draftModel),
            'mapCenter' => $locationActive
                ? ['lat' => $userLat, 'lng' => $userLng]
                : ['lat' => -6.7766, 'lng' => -79.8442],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function discoverFilters(
        Request $request,
        RestaurantExploreService $explore,
        ?float $userLat,
        ?float $userLng,
        bool $locationActive,
        bool $favoritesOnly,
        string $sort,
        int $page,
    ): array {
        $cuisineIds = $explore->intList($request, 'cuisine_type_ids');
        if ($cuisineIds === [] && $request->integer('cuisine_type_id')) {
            $cuisineIds = [$request->integer('cuisine_type_id')];
        }

        $priceRanges = $explore->stringList($request, 'price_ranges');
        if ($priceRanges === [] && $request->string('price_range')->value()) {
            $priceRanges = [$request->string('price_range')->value()];
        }
        $allowedPrices = PriceRange::VALUES;
        $priceRanges = array_values(array_filter(
            $priceRanges,
            fn (string $v) => in_array($v, $allowedPrices, true),
        ));

        return [
            'search' => $request->string('search')->value(),
            'cuisine_type_id' => $cuisineIds[0] ?? null,
            'cuisine_type_ids' => $cuisineIds,
            'favorites_only' => $favoritesOnly,
            'price_range' => $priceRanges[0] ?? null,
            'price_ranges' => $priceRanges,
            'ambiance_ids' => $explore->intList($request, 'ambiance_ids'),
            'restaurant_environment_ids' => $explore->intList($request, 'restaurant_environment_ids'),
            'party_type_ids' => $explore->intList($request, 'party_type_ids'),
            'district_id' => $request->integer('district_id') ?: null,
            'open_now' => $request->boolean('open_now'),
            'sort' => $sort,
            'page' => $page,
            'view' => $request->string('view')->value() === 'map' ? 'map' : 'list',
            'lat' => $userLat,
            'lng' => $userLng,
            'location_active' => $locationActive,
        ];
    }

    /** @return list<string> */
    private function partialDataKeys(Request $request): array
    {
        $partialData = $request->header('X-Inertia-Partial-Data', '');
        if ($partialData === '') {
            return [];
        }

        return array_values(array_filter(array_map(trim(...), explode(',', $partialData))));
    }

    /** @param  list<string>  $partialKeys */
    private function wantsDraftOnly(array $partialKeys): bool
    {
        return $partialKeys !== []
            && ! array_diff($partialKeys, ['draftRoute', 'draftStopSlugs']);
    }

    /** @param  list<string>  $partialKeys */
    private function wantsFilterPartial(array $partialKeys): bool
    {
        if ($partialKeys === []) {
            return false;
        }

        $allowed = ['restaurants', 'markers', 'filters', 'favoritesCount', 'pagination'];

        return empty(array_diff($partialKeys, $allowed));
    }

    /** @return list<int> */
    private function draftStopRestaurantIds(User $user): array
    {
        return TouristRouteStop::query()
            ->whereHas('route', fn ($q) => $q->where('user_id', $user->id)->where('status', 'draft'))
            ->pluck('restaurant_id')
            ->all();
    }

    /** @return array{draftRoute: array<string, mixed>, draftStopSlugs: list<string>} */
    private function draftPayload(
        User $user,
        TouristRouteService $routes,
        ?TouristRoute $draftModel = null,
    ): array {
        $draftModel ??= $routes->draftFor($user);
        $draft = $routes->formatRoute($draftModel, $user);
        $draftStopSlugs = collect($draft['stops'] ?? [])
            ->map(fn ($s) => $s['restaurant']['slug'] ?? null)
            ->filter()
            ->values()
            ->all();

        return [
            'draftRoute' => $draft,
            'draftStopSlugs' => $draftStopSlugs,
        ];
    }
}
