<?php

namespace App\Services;

class GeoDistanceService
{
    /** Distancia en km entre dos puntos (fórmula de Haversine). */
    public function kmBetween(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return round($earthRadius * $c, 2);
    }

    /**
     * @param  array<int, array{lat: float, lng: float}>  $points
     * @return array{distance_km: float, estimated_minutes: int, path: array<int, array{0: float, 1: float}>}
     */
    public function pathStats(array $points): array
    {
        if (count($points) < 2) {
            return [
                'distance_km' => 0,
                'estimated_minutes' => count($points) * 25,
                'path' => array_map(fn ($p) => [$p['lat'], $p['lng']], $points),
            ];
        }

        $distance = 0.0;
        for ($i = 1; $i < count($points); $i++) {
            $distance += $this->kmBetween(
                $points[$i - 1]['lat'],
                $points[$i - 1]['lng'],
                $points[$i]['lat'],
                $points[$i]['lng'],
            );
        }

        // ~5 km/h caminando en ciudad + 20 min por parada gastronómica
        $walkMinutes = (int) round(($distance / 5) * 60);
        $stopMinutes = count($points) * 20;

        return [
            'distance_km' => round($distance, 2),
            'estimated_minutes' => max(15, $walkMinutes + $stopMinutes),
            'path' => array_map(fn ($p) => [$p['lat'], $p['lng']], $points),
        ];
    }
}
