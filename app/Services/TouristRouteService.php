<?php

namespace App\Services;

use App\Models\Restaurant;
use App\Models\RestaurantReservation;
use App\Models\TouristRoute;
use App\Models\TouristRouteStop;
use App\Models\User;
use App\Support\PublicStorage;
use App\Support\RestaurantHoursPresenter;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
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
    public function replaceDraftStops(User $user, array $restaurants, bool $generatedByAi = false): TouristRoute
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

        $route->update(['generated_by_ai' => $generatedByAi]);

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

        $route->update(['generated_by_ai' => false]);

        return $this->syncDraftMetrics($route);
    }

    public function removeStop(User $user, Restaurant $restaurant): TouristRoute
    {
        $route = $this->draftFor($user);
        $route->stops()->where('restaurant_id', $restaurant->id)->delete();
        $route->update(['generated_by_ai' => false]);
        $this->reorderStops($route);

        return $this->syncDraftMetrics($route);
    }

    /**
     * @param  list<string>  $orderedSlugs
     */
    public function reorderDraftStops(User $user, array $orderedSlugs): TouristRoute
    {
        $route = $this->draftFor($user)->load(['stops.restaurant']);
        $bySlug = $route->stops->keyBy(fn (TouristRouteStop $stop) => $stop->restaurant->slug);
        $unique = array_values(array_unique($orderedSlugs));

        if ($unique === [] || count($unique) !== $bySlug->count()) {
            throw ValidationException::withMessages([
                'slugs' => 'El orden debe incluir todas las paradas de tu lista.',
            ]);
        }

        foreach ($unique as $slug) {
            if (! $bySlug->has($slug)) {
                throw ValidationException::withMessages([
                    'slugs' => 'Hay un local que ya no está en tu lista.',
                ]);
            }
        }

        DB::transaction(function () use ($unique, $bySlug) {
            foreach ($unique as $index => $slug) {
                $bySlug->get($slug)->update(['position' => 100 + $index]);
            }
            foreach ($unique as $index => $slug) {
                $bySlug->get($slug)->update(['position' => $index + 1]);
            }
        });

        $route->update(['generated_by_ai' => false]);

        return $this->syncDraftMetrics($route->fresh());
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

        $fresh = $this->syncDraftMetrics($route);

        TouristRoute::create([
            'user_id' => $user->id,
            'name' => 'Mi ruta gastronómica',
            'slug' => 'ruta-'.$user->id.'-'.Str::lower(Str::random(6)),
            'status' => 'draft',
        ]);

        return $fresh;
    }

    public function toggleFavorite(User $user, TouristRoute $route): bool
    {
        abort_unless($route->user_id === $user->id, 403);
        abort_unless($route->status === 'active', 404);

        $attached = $user->favoriteRoutes()->where('tourist_route_id', $route->id)->exists();

        if ($attached) {
            $user->favoriteRoutes()->detach($route->id);

            return false;
        }

        $user->favoriteRoutes()->syncWithoutDetaching([$route->id]);

        return true;
    }

    /** @return list<int> */
    public function favoritedRouteIds(User $user): array
    {
        return $user->favoriteRoutes()->pluck('tourist_routes.id')->map(fn ($id) => (int) $id)->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function favoritedRoutesPayload(User $user): array
    {
        $routes = $user->favoriteRoutes()
            ->where('status', 'active')
            ->with([
                'stops.restaurant.cuisineTypes',
                'stops.restaurant.cuisineType',
                'stops.restaurant.images',
            ])
            ->orderByPivot('created_at', 'desc')
            ->get();

        return $routes->map(fn (TouristRoute $route) => $this->formatFavoriteCard($route, $user))->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function formatFavoriteCard(TouristRoute $route, User $user): array
    {
        $route->loadMissing([
            'stops.restaurant.cuisineTypes',
            'stops.restaurant.cuisineType',
            'stops.restaurant.images',
        ]);

        $covers = $route->stops
            ->map(fn (TouristRouteStop $stop) => PublicStorage::url(
                $stop->restaurant->images->first()?->path ?? $stop->restaurant->cover_image,
            ))
            ->filter()
            ->unique()
            ->take(4)
            ->values()
            ->all();

        $cuisines = $route->stops
            ->flatMap(function (TouristRouteStop $stop) {
                $r = $stop->restaurant;
                $types = $r->cuisineTypes->isNotEmpty()
                    ? $r->cuisineTypes
                    : collect($r->cuisineType ? [$r->cuisineType] : []);

                return $types->pluck('name');
            })
            ->unique()
            ->take(4)
            ->values()
            ->all();

        $savedAt = $route->pivot->created_at ?? $route->updated_at;

        return [
            'id' => $route->id,
            'name' => $route->name,
            'slug' => $route->slug,
            'description' => $route->description,
            'stops_count' => (int) $route->stops_count,
            'total_distance_km' => $route->total_distance_km !== null ? (float) $route->total_distance_km : null,
            'estimated_minutes' => $route->estimated_minutes,
            'generated_by_ai' => (bool) $route->generated_by_ai,
            'is_completed' => $route->isCompleted(),
            'saved_at' => $savedAt?->toDateString(),
            'cover_urls' => $covers,
            'cuisine_tags' => $cuisines,
            'path_coordinates' => $route->path_coordinates ?? [],
            'numbered_stops' => $route->stops
                ->filter(fn (TouristRouteStop $s) => $s->restaurant->latitude && $s->restaurant->longitude)
                ->values()
                ->map(fn (TouristRouteStop $s, int $i) => [
                    'position' => $i + 1,
                    'lat' => (float) $s->restaurant->latitude,
                    'lng' => (float) $s->restaurant->longitude,
                    'name' => $s->restaurant->name,
                ])
                ->all(),
        ];
    }

    public function complete(User $user, TouristRoute $route): TouristRoute
    {
        abort_unless($route->user_id === $user->id && $route->status === 'active', 403);

        $route->update(['completed_at' => now()]);

        return $route->fresh();
    }

    /** Métricas rápidas para borrador (sin OSRM); el mapa refina la ruta en el cliente. */
    public function syncDraftMetrics(TouristRoute $route): TouristRoute
    {
        $points = $this->stopCoordinatePoints($route);

        $stats = $this->geo->pathStats($points);

        $route->update([
            'stops_count' => count($points),
            'total_distance_km' => $stats['distance_km'],
            'estimated_minutes' => $stats['estimated_minutes'],
            'path_coordinates' => $stats['path'],
            'generated_by_ai' => count($points) > 0 ? $route->generated_by_ai : false,
        ]);

        return $route->fresh(['stops.restaurant.cuisineTypes', 'stops.restaurant.cuisineType', 'stops.restaurant.district']);
    }

    public function refreshMetrics(TouristRoute $route): TouristRoute
    {
        $points = $this->stopCoordinatePoints($route);

        $stats = $this->streetRouting->routeStatsWithFallback($points);

        $route->update([
            'stops_count' => count($points),
            'total_distance_km' => $stats['distance_km'],
            'estimated_minutes' => $stats['estimated_minutes'],
            'path_coordinates' => $stats['path'],
            'generated_by_ai' => count($points) > 0 ? $route->generated_by_ai : false,
        ]);

        return $route->fresh(['stops.restaurant.cuisineTypes', 'stops.restaurant.cuisineType', 'stops.restaurant.district']);
    }

    /**
     * @return array<int, array{lat: float, lng: float}>
     */
    private function stopCoordinatePoints(TouristRoute $route): array
    {
        $route->loadMissing(['stops.restaurant']);

        return $route->stops
            ->sortBy('position')
            ->map(fn (TouristRouteStop $stop) => $stop->restaurant)
            ->filter(fn (?Restaurant $r) => $r && $r->latitude && $r->longitude)
            ->map(fn (Restaurant $r) => [
                'lat' => (float) $r->latitude,
                'lng' => (float) $r->longitude,
            ])
            ->values()
            ->all();
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
        $route->loadMissing([
            'stops.restaurant.cuisineTypes',
            'stops.restaurant.cuisineType',
            'stops.restaurant.district',
            'stops.restaurant.images',
        ]);

        $reservationsByStopId = $this->reservationsForStops($user, $route);

        return [
            'id' => $route->id,
            'name' => $route->name,
            'slug' => $route->slug,
            'description' => $route->description,
            'status' => $route->status,
            'generated_by_ai' => (bool) $route->generated_by_ai,
            'is_favorited' => $user ? $user->favoriteRoutes()->where('tourist_route_id', $route->id)->exists() : false,
            'route_date' => $route->route_date?->toDateString(),
            'completed_at' => $route->completed_at?->toIso8601String(),
            'is_completed' => $route->isCompleted(),
            'stops_count' => $route->stops_count,
            'total_distance_km' => $route->total_distance_km !== null ? (float) $route->total_distance_km : null,
            'estimated_minutes' => $route->estimated_minutes,
            'path_coordinates' => $route->path_coordinates ?? [],
            'stops' => $route->stops->sortBy('position')->values()->map(function (TouristRouteStop $stop, int $index) use ($user, $reservationsByStopId) {
                $r = $stop->restaurant;
                $cuisines = $r->cuisineTypes->isNotEmpty()
                    ? $r->cuisineTypes
                    : ($r->cuisineType ? collect([$r->cuisineType]) : collect());

                $reservation = $user
                    ? $reservationsByStopId->get($stop->id)
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
                        'cover_url' => PublicStorage::url($r->images->first()?->path ?? $r->cover_image),
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

    /** @return Collection<int, RestaurantReservation> */
    private function reservationsForStops(?User $user, TouristRoute $route): Collection
    {
        if (! $user || $route->stops->isEmpty()) {
            return collect();
        }

        $stopIds = $route->stops->pluck('id')->all();

        return RestaurantReservation::query()
            ->where('user_id', $user->id)
            ->whereIn('tourist_route_stop_id', $stopIds)
            ->whereIn('status', [
                RestaurantReservation::STATUS_PENDING,
                RestaurantReservation::STATUS_CONFIRMED,
                RestaurantReservation::STATUS_VISITED,
            ])
            ->orderByDesc('id')
            ->get()
            ->unique('tourist_route_stop_id')
            ->keyBy('tourist_route_stop_id');
    }
}
