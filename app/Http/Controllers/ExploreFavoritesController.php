<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use App\Models\TouristRoute;
use App\Services\RestaurantExploreService;
use App\Services\TouristRouteService;
use App\Services\UserInteractionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class ExploreFavoritesController extends Controller
{
    public function index(
        Request $request,
        RestaurantExploreService $explore,
        UserInteractionService $interactions,
        TouristRouteService $routes,
    ): mixed {
        if (! $request->user()?->hasRole('tourist')) {
            return Redirect::route('dashboard');
        }

        $user = $request->user();
        $tab = $request->string('tab')->value() === 'routes' ? 'routes' : 'restaurants';
        $sort = $request->string('sort')->value() ?: 'recent';

        $savedAt = $interactions->favoritedRestaurantSavedAt($user);
        $ids = array_keys($savedAt);

        $restaurants = Restaurant::query()
            ->whereIn('id', $ids !== [] ? $ids : [0])
            ->where('is_active', true)
            ->where('is_verified', true)
            ->with([
                'cuisineTypes:id,name',
                'cuisineType:id,name',
                'ambiance:id,name',
                'district:id,name',
                'restaurantEnvironments:id,name',
                'partyTypes:id,name',
                'images' => fn ($q) => $q->where('is_cover', true)->limit(1),
                'schedules',
            ])
            ->get()
            ->map(function (Restaurant $restaurant) use ($explore, $savedAt) {
                return array_merge($explore->formatCard($restaurant), [
                    'is_favorited' => true,
                    'saved_at' => $savedAt[$restaurant->id] ?? null,
                ]);
            });

        if ($sort === 'name') {
            $restaurants = $restaurants->sortBy(fn ($r) => mb_strtolower($r['name']))->values();
        } else {
            $restaurants = $restaurants->sortByDesc(fn ($r) => $r['saved_at'] ?? '')->values();
        }

        $routeCards = $routes->favoritedRoutesPayload($user);
        if ($sort === 'name') {
            usort($routeCards, fn ($a, $b) => strcasecmp($a['name'], $b['name']));
        }

        return Inertia::render('explore/favorites/index', [
            'tab' => $tab,
            'sort' => $sort,
            'restaurants' => $restaurants,
            'routes' => $routeCards,
        ]);
    }

    public function toggleRoute(Request $request, TouristRoute $route, TouristRouteService $routes): RedirectResponse
    {
        abort_unless($request->user()?->hasRole('tourist'), 403);

        $favorited = $routes->toggleFavorite($request->user(), $route);

        return back()->with('success', $favorited ? 'Ruta guardada en favoritos.' : 'Ruta quitada de favoritos.');
    }
}
