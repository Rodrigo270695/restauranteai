<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class StreetRoutingService
{
    public function __construct(
        private GeoDistanceService $geo,
    ) {}

    /**
     * @param  array<int, array{lat: float, lng: float}>  $points
     * @return array{distance_km: float, estimated_minutes: int, path: array<int, array{0: float, 1: float}>}|null
     */
    public function routeStats(array $points): ?array
    {
        if (count($points) < 2) {
            return $this->geo->pathStats($points);
        }

        foreach (['foot', 'walking', 'driving'] as $profile) {
            $result = $this->requestRoute($points, $profile);
            if ($result !== null) {
                return $result;
            }
        }

        return $this->routeStatsByLegs($points);
    }

    /**
     * @param  array<int, array{lat: float, lng: float}>  $points
     * @return array{distance_km: float, estimated_minutes: int, path: array<int, array{0: float, 1: float}>}
     */
    public function routeStatsWithFallback(array $points): array
    {
        $routed = $this->routeStats($points);

        if ($routed !== null && $this->isDetailedPath($routed['path'], count($points))) {
            return $routed;
        }

        $byLegs = $this->routeStatsByLegs($points);
        if ($byLegs !== null && $this->isDetailedPath($byLegs['path'], count($points))) {
            return $byLegs;
        }

        return $routed ?? $this->geo->pathStats($points);
    }

    /**
     * @param  array<int, array{lat: float, lng: float}>  $points
     * @return array{distance_km: float, estimated_minutes: int, path: array<int, array{0: float, 1: float}>}|null
     */
    private function requestRoute(array $points, string $profile): ?array
    {
        $baseUrl = rtrim((string) config('services.osrm.url', 'https://router.project-osrm.org'), '/');

        $coordinateString = collect($points)
            ->map(fn (array $p) => $p['lng'].','.$p['lat'])
            ->implode(';');

        try {
            $response = Http::timeout(15)
                ->withHeaders(['User-Agent' => 'DiscoverLambo/1.0 (thesis project)'])
                ->get("{$baseUrl}/route/v1/{$profile}/{$coordinateString}", [
                    'overview' => 'full',
                    'geometries' => 'geojson',
                    'steps' => 'false',
                ]);

            if (! $response->successful()) {
                return null;
            }

            return $this->parseOsrmRoute($response->json('routes.0'), count($points));
        } catch (\Throwable $e) {
            Log::debug('OSRM single request failed', ['profile' => $profile, 'message' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * Une tramos A→B, B→C para obtener geometría por calles.
     *
     * @param  array<int, array{lat: float, lng: float}>  $points
     * @return array{distance_km: float, estimated_minutes: int, path: array<int, array{0: float, 1: float}>}|null
     */
    private function routeStatsByLegs(array $points): ?array
    {
        $mergedPath = [];
        $totalDistanceKm = 0.0;
        $totalWalkMinutes = 0;

        for ($i = 0; $i < count($points) - 1; $i++) {
            $legPoints = [$points[$i], $points[$i + 1]];
            $leg = null;

            foreach (['foot', 'walking', 'driving'] as $profile) {
                $leg = $this->requestRoute($legPoints, $profile);
                if ($leg !== null && count($leg['path']) >= 2) {
                    break;
                }
            }

            if ($leg === null || count($leg['path']) < 2) {
                return null;
            }

            $slice = $i === 0 ? $leg['path'] : array_slice($leg['path'], 1);
            array_push($mergedPath, ...$slice);
            $totalDistanceKm += (float) $leg['distance_km'];
            $totalWalkMinutes += max(5, (int) $leg['estimated_minutes'] - 20);
        }

        if (count($mergedPath) < 2) {
            return null;
        }

        $stopMinutes = count($points) * 20;

        return [
            'distance_km' => round($totalDistanceKm, 2),
            'estimated_minutes' => max(15, $totalWalkMinutes + $stopMinutes),
            'path' => $mergedPath,
        ];
    }

    /**
     * @param  array<int, array{0: float, 1: float}>  $path
     */
    private function isDetailedPath(array $path, int $stopCount): bool
    {
        if ($stopCount < 2) {
            return true;
        }

        return count($path) > $stopCount + 2;
    }

    /**
     * @return array{distance_km: float, estimated_minutes: int, path: array<int, array{0: float, 1: float}>}|null
     */
    private function parseOsrmRoute(?array $route, int $stopCount): ?array
    {
        if (! is_array($route)) {
            return null;
        }

        $coordinates = $route['geometry']['coordinates'] ?? [];

        if (! is_array($coordinates) || count($coordinates) < 2) {
            return null;
        }

        /** @var array<int, array{0: float, 1: float}> $path */
        $path = array_map(
            fn (array $pair) => [(float) $pair[1], (float) $pair[0]],
            $coordinates,
        );

        $distanceKm = round(((float) ($route['distance'] ?? 0)) / 1000, 2);
        $walkMinutes = (int) round(((float) ($route['duration'] ?? 0)) / 60);
        $stopMinutes = $stopCount * 20;

        return [
            'distance_km' => $distanceKm,
            'estimated_minutes' => max(15, $walkMinutes + $stopMinutes),
            'path' => $path,
        ];
    }
}
