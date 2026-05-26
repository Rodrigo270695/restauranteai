<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use App\Services\RestaurantExploreService;
use App\Services\TouristRouteService;
use App\Services\UserInteractionService;
use App\Support\PublicStorage;
use App\Support\RestaurantHoursPresenter;
use App\Support\RestaurantMenuPresenter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class ExploreRestaurantController extends Controller
{
    public function show(
        Request $request,
        Restaurant $restaurant,
        RestaurantExploreService $explore,
        RestaurantHoursPresenter $hours,
        TouristRouteService $routes,
        UserInteractionService $interactions,
    ): mixed {
        if (! $request->user()?->hasRole('tourist')) {
            return Redirect::route('dashboard');
        }

        abort_unless($restaurant->is_active && $restaurant->is_verified, 404);

        $restaurant->load([
            'cuisineTypes:id,name',
            'cuisineType:id,name',
            'district:id,name',
            'images' => fn ($q) => $q->orderByDesc('is_cover')->orderBy('display_order'),
            'schedules',
        ]);

        $user = $request->user();
        $draft = $routes->draftFor($user);
        $inRoute = $draft->stops()->where('restaurant_id', $restaurant->id)->exists();

        $interactions->recordViewOnce($user, $restaurant);

        if ($request->boolean('from_recommendation')) {
            $requestId = $request->integer('request_id') ?: null;
            $interactions->markRecommendationEngagement($user, $restaurant, $requestId);
        }

        $cuisines = $restaurant->cuisineTypes->isNotEmpty()
            ? $restaurant->cuisineTypes
            : ($restaurant->cuisineType ? collect([$restaurant->cuisineType]) : collect());

        return Inertia::render('explore/restaurants/show', [
            'restaurant' => [
                'id' => $restaurant->id,
                'name' => $restaurant->name,
                'slug' => $restaurant->slug,
                'description' => $restaurant->description,
                'short_description' => $restaurant->short_description,
                'address' => $restaurant->address,
                'price_range' => $restaurant->price_range,
                'avg_rating' => round((float) $restaurant->avg_rating, 1),
                'total_reviews' => (int) $restaurant->total_reviews,
                'phone' => $restaurant->phone,
                'whatsapp' => $restaurant->whatsapp,
                'district' => $restaurant->district?->name,
                'latitude' => $restaurant->latitude !== null ? (float) $restaurant->latitude : null,
                'longitude' => $restaurant->longitude !== null ? (float) $restaurant->longitude : null,
                'cuisines' => $cuisines->map(fn ($c) => [
                    'name' => $c->name,
                    'is_primary' => (bool) ($c->pivot->is_primary ?? false),
                ])->values()->all(),
                'images' => $restaurant->images->map(fn ($img) => [
                    'url' => PublicStorage::url($img->path),
                    'alt' => $img->alt_text,
                ])->values()->all(),
                'menu' => RestaurantMenuPresenter::forRestaurant($restaurant),
                'hours' => $hours->forSchedules($restaurant->schedules),
            ],
            'inRoute' => $inRoute,
            'draftStopsCount' => $draft->stops_count,
            'isFavorited' => $interactions->isFavorited($user, $restaurant),
        ]);
    }
}
