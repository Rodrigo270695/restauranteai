<?php

namespace App\Services;

use App\Models\Restaurant;
use App\Models\User;
use App\Support\RestaurantHoursPresenter;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class RouteRecommendationService
{
    public function __construct(
        private RecommendationService $recommendations,
        private TouristRouteService $routes,
        private GeoDistanceService $geo,
        private RestaurantHoursPresenter $hours,
    ) {}

    /**
     * Genera un borrador de ruta ordenado por proximidad a partir del motor de recomendaciones.
     *
     * @param  array<string, mixed>  $context
     * @return array{route: array<string, mixed>, meta: array<string, mixed>}
     */
    public function buildDraftFromRecommendations(User $user, array $context = [], int $maxStops = 5): array
    {
        $maxStops = min(max($maxStops, 2), 8);

        $payload = $this->recommendations->forUser(
            $user,
            $context,
            topN: max($maxStops * 2, 10),
            fresh: true,
        );

        $rankedIds = collect($payload['items'])->pluck('id')->all();

        if ($rankedIds === []) {
            if (($payload['meta']['ml_available'] ?? true) === false) {
                throw ValidationException::withMessages([
                    'route' => 'El servicio de recomendaciones con IA no está disponible. Inténtalo más tarde.',
                ]);
            }

            throw ValidationException::withMessages([
                'route' => 'No encontramos locales para armar una ruta. Completa tu perfil o actualiza las recomendaciones.',
            ]);
        }

        $restaurants = Restaurant::query()
            ->whereIn('id', $rankedIds)
            ->where('is_active', true)
            ->where('is_verified', true)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->with('schedules')
            ->get()
            ->sortBy(fn (Restaurant $r) => array_search($r->id, $rankedIds, true))
            ->values()
            ->filter(fn (Restaurant $r) => $this->hours->isOpen($r))
            ->values();

        if ($restaurants->isEmpty()) {
            throw ValidationException::withMessages([
                'route' => 'No hay locales abiertos ahora para armar la ruta. Prueba más tarde o explora el mapa.',
            ]);
        }

        $ordered = $this->orderByNearestNeighbor(
            $restaurants,
            isset($context['latitude']) ? (float) $context['latitude'] : null,
            isset($context['longitude']) ? (float) $context['longitude'] : null,
        )->take($maxStops);

        $route = $this->routes->replaceDraftStops($user, $ordered->all(), generatedByAi: true);

        return [
            'route' => $this->routes->formatRoute($route),
            'meta' => array_merge($payload['meta'], [
                'stops_count' => $ordered->count(),
                'route_ordering' => 'ai_nearest_neighbor',
            ]),
        ];
    }

    /**
     * @param  list<Restaurant>  $restaurants
     */
    private function orderByNearestNeighbor(
        Collection $restaurants,
        ?float $startLat,
        ?float $startLng,
    ): Collection {
        $remaining = $restaurants->values()->all();
        $ordered = [];

        $first = $remaining[0];
        $lat = $startLat ?? (float) $first->latitude;
        $lng = $startLng ?? (float) $first->longitude;

        while ($remaining !== []) {
            $nearestIndex = 0;
            $nearestDistance = PHP_FLOAT_MAX;

            foreach ($remaining as $index => $restaurant) {
                $distance = $this->geo->kmBetween(
                    $lat,
                    $lng,
                    (float) $restaurant->latitude,
                    (float) $restaurant->longitude,
                );

                if ($distance < $nearestDistance) {
                    $nearestDistance = $distance;
                    $nearestIndex = $index;
                }
            }

            $picked = $remaining[$nearestIndex];
            $ordered[] = $picked;
            array_splice($remaining, $nearestIndex, 1);
            $lat = (float) $picked->latitude;
            $lng = (float) $picked->longitude;
        }

        return collect($ordered);
    }
}
