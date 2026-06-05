<?php

namespace App\Services;

use App\Models\Restaurant;
use App\Models\TouristRoute;
use App\Models\TouristRouteStop;
use App\Models\User;
use App\Support\RestaurantHoursPresenter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TouristRouteService
{
    public function __construct(
        private GeoDistanceService $geo,
        private StreetRoutingService $streetRouting,
        private RestaurantHoursPresenter $hours,
        private RestaurantReservationService $reservations,
    ) {}

    public function draftFor(User $user): TouristRoute
    {
        return TouristRoute::firstOrCreate(
            [
                'user_id' => $user->id,
                'status' => 'draft',
            ],
            [
                'name' => 'Mi ruta gastronómica',
                'slug' => 'ruta-'.$user->id.'-'.Str::lower(Str::random(6)),
            ],
        );
    }

    /**
     * Reemplaza todas las paradas del borrador por la lista ordenada (p. ej. ruta IA).
     *
     * @param  list<Restaurant>  $restaurants
     */
    public function replaceDraftStops(User $user, array $restaurants): TouristRoute
    {
        $route = $this->draftFor($user);
        $route->stops()->delete();

        foreach (array_slice($restaurants, 0, 8) as $restaurant) {
            abort_unless($restaurant->is_active && $restaurant->is_verified, 404);
            $this->hours->assertOpenForVisit($restaurant);
            TouristRouteStop::create([
                'tourist_route_id' => $route->id,
                'restaurant_id' => $restaurant->id,
                'position' => (int) $route->stops()->max('position') + 1,
            ]);
        }

        return $this->refreshMetrics($route);
    }

    public function addStop(User $user, Restaurant $restaurant): TouristRoute
    {
        abort_unless($restaurant->is_active && $restaurant->is_verified, 404);
        $this->hours->assertOpenForVisit($restaurant);

        $route = $this->draftFor($user);

        if ($route->stops()->where('restaurant_id', $restaurant->id)->exists()) {
            return $route->load(['stops.restaurant.cuisineTypes', 'stops.restaurant.district']);
        }

        if ($route->stops()->count() >= 8) {
            throw ValidationException::withMessages([
                'restaurant' => 'Máximo 8 paradas por ruta.',
            ]);
        }

        $position = (int) $route->stops()->max('position') + 1;

        TouristRouteStop::create([
            'tourist_route_id' => $route->id,
            'restaurant_id' => $restaurant->id,
            'position' => $position,
        ]);

        return $this->refreshMetrics($route);
    }

    public function removeStop(User $user, Restaurant $restaurant): TouristRoute
    {
        $route = $this->draftFor($user);
        $route->stops()->where('restaurant_id', $restaurant->id)->delete();
        $this->reorderStops($route);

        return $this->refreshMetrics($route);
    }

    public function publish(User $user, string $name, ?string $description = null, ?string $routeDate = null): TouristRoute
    {
        $route = $this->draftFor($user)->load('stops.restaurant');

        if ($route->stops->isEmpty()) {
            throw ValidationException::withMessages([
                'stops' => 'Agrega al menos un restaurante a tu ruta.',
            ]);
        }

        $route->update([
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(5)),
            'description' => $description,
            'status' => 'active',
            'route_date' => $routeDate ?? now()->toDateString(),
            'completed_at' => null,
        ]);

        $fresh = $this->refreshMetrics($route);

        TouristRoute::create([
            'user_id' => $user->id,
            'name' => 'Mi ruta gastronómica',
            'slug' => 'ruta-'.$user->id.'-'.Str::lower(Str::random(6)),
            'status' => 'draft',
        ]);

        return $fresh;
    }

    public function complete(User $user, TouristRoute $route): TouristRoute
    {
        abort_unless($route->user_id === $user->id && $route->status === 'active', 403);

        $route->update(['completed_at' => now()]);

        return $route->fresh();
    }

    public function refreshMetrics(TouristRoute $route): TouristRoute
    {
        $route->load(['stops.restaurant.cuisineTypes', 'stops.restaurant.cuisineType', 'stops.restaurant.district']);

        $points = $route->stops
            ->sortBy('position')
            ->map(fn (TouristRouteStop $stop) => $stop->restaurant)
            ->filter(fn (?Restaurant $r) => $r && $r->latitude && $r->longitude)
            ->map(fn (Restaurant $r) => [
                'lat' => (float) $r->latitude,
                'lng' => (float) $r->longitude,
            ])
            ->values()
            ->all();

        $stats = $this->streetRouting->routeStatsWithFallback($points);

        $route->update([
            'stops_count' => $route->stops()->count(),
            'total_distance_km' => $stats['distance_km'],
            'estimated_minutes' => $stats['estimated_minutes'],
            'path_coordinates' => $stats['path'],
        ]);

        return $route->fresh(['stops.restaurant.cuisineTypes', 'stops.restaurant.district']);
    }

    private function reorderStops(TouristRoute $route): void
    {
        $route->stops()->orderBy('position')->get()->values()->each(function (TouristRouteStop $stop, int $index) {
            $stop->update(['position' => $index + 1]);
        });
    }

    /** @return array<string, mixed> */
    public function formatRoute(TouristRoute $route, ?User $user = null): array
    {
        $route->loadMissing(['stops.restaurant.cuisineTypes', 'stops.restaurant.cuisineType', 'stops.restaurant.district']);

        return [
            'id' => $route->id,
            'name' => $route->name,
            'slug' => $route->slug,
            'description' => $route->description,
            'status' => $route->status,
            'route_date' => $route->route_date?->toDateString(),
            'completed_at' => $route->completed_at?->toIso8601String(),
            'is_completed' => $route->isCompleted(),
            'stops_count' => $route->stops_count,
            'total_distance_km' => $route->total_distance_km !== null ? (float) $route->total_distance_km : null,
            'estimated_minutes' => $route->estimated_minutes,
            'path_coordinates' => $route->path_coordinates ?? [],
            'stops' => $route->stops->sortBy('position')->values()->map(function (TouristRouteStop $stop, int $index) use ($user) {
                $r = $stop->restaurant;
                $cuisines = $r->cuisineTypes->isNotEmpty()
                    ? $r->cuisineTypes
                    : ($r->cuisineType ? collect([$r->cuisineType]) : collect());

                $reservation = $user
                    ? $this->reservations->reservationForStop($user, $stop)
                    : null;

                return [
                    'stop_id' => $stop->id,
                    'position' => $index + 1,
                    'reservation' => $this->reservations->formatReservation($reservation, $user),
                    'restaurant' => [
                        'id' => $r->id,
                        'name' => $r->name,
                        'slug' => $r->slug,
                        'address' => $r->address,
                        'district' => $r->district?->name,
                        'avg_rating' => round((float) $r->avg_rating, 1),
                        'latitude' => $r->latitude !== null ? (float) $r->latitude : null,
                        'longitude' => $r->longitude !== null ? (float) $r->longitude : null,
                        'cuisines' => $cuisines->map(fn ($c) => [
                            'name' => $c->name,
                            'is_primary' => (bool) ($c->pivot->is_primary ?? false),
                        ])->values()->all(),
                    ],
                ];
            })->all(),
        ];
    }
}
