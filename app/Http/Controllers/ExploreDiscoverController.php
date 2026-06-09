<?php

namespace App\Http\Controllers;

use App\Models\TouristRoute;
use App\Models\User;
use App\Services\RestaurantExploreService;
use App\Services\TouristRouteService;
use App\Services\UserInteractionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class ExploreDiscoverController extends Controller
{
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
        $partialData = $request->header('X-Inertia-Partial-Data', '');

        if ($partialData !== '' && $this->wantsDraftOnly($partialData)) {
            return Inertia::render('explore/discover/index', $this->draftPayload($user, $routes));
        }

        ['lat' => $userLat, 'lng' => $userLng] = $explore->parseUserCoordinates($request);
        $locationActive = $userLat !== null && $userLng !== null;
        $nearbyLimit = 30;

        $favoritesOnly = $request->boolean('favorites_only');
        $favoritedIds = $interactions->favoritedRestaurantIds($user);

        $query = $explore->publicQuery($request);

        if ($favoritesOnly) {
            $query->whereIn('id', $favoritedIds !== [] ? $favoritedIds : [0]);
        }

        $restaurants = $query->get();

        if ($locationActive) {
            $restaurants = $explore->orderWithNearbyFirst($restaurants, $userLat, $userLng, $nearbyLimit);
        }

        $favoritedSet = array_fill_keys($favoritedIds, true);
        $draftModel = $routes->draftFor($user);
        $draftStopRestaurantIds = $draftModel->stops()->pluck('restaurant_id')->all();
        $draftPayload = $this->draftPayload($user, $routes, $draftModel);

        return Inertia::render('explore/discover/index', [
            'restaurants' => $restaurants->map(fn ($r) => array_merge(
                $explore->formatCard($r, $userLat, $userLng),
                ['is_favorited' => isset($favoritedSet[$r->id])],
            )),
            'favoritesCount' => count($favoritedIds),
            'markers' => $explore->mapMarkersForDiscover(
                $restaurants,
                $nearbyLimit,
                $userLat,
                $userLng,
                $draftStopRestaurantIds,
            )->values(),
            'cuisineTypes' => $explore->activeCuisines(),
            'filters' => [
                'search' => $request->string('search')->value(),
                'cuisine_type_id' => $request->integer('cuisine_type_id') ?: null,
                'favorites_only' => $favoritesOnly,
                'price_range' => $request->string('price_range')->value() ?: null,
                'view' => $request->string('view')->value() === 'list' ? 'list' : 'map',
                'lat' => $userLat,
                'lng' => $userLng,
                'location_active' => $locationActive,
            ],
            'nearbyLimit' => $nearbyLimit,
            ...$draftPayload,
            'mapCenter' => $locationActive
                ? ['lat' => $userLat, 'lng' => $userLng]
                : ['lat' => -6.7766, 'lng' => -79.8442],
        ]);
    }

    private function wantsDraftOnly(string $partialData): bool
    {
        $keys = array_map(trim(...), explode(',', $partialData));

        return $keys !== []
            && ! array_diff($keys, ['draftRoute', 'draftStopSlugs']);
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
