<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class AddressGeocoderService
{
    /** Chiclayo — sesgo por defecto para búsquedas en Lambayeque. */
    private const DEFAULT_LAT = -6.7766;

    private const DEFAULT_LNG = -79.8442;

    /**
     * @return array{lat: float, lng: float}|null
     */
    public function geocode(string $address, ?float $biasLat = null, ?float $biasLng = null): ?array
    {
        $query = trim($address);
        if ($query === '') {
            return null;
        }

        $biasLat ??= self::DEFAULT_LAT;
        $biasLng ??= self::DEFAULT_LNG;

        $response = Http::withHeaders([
            'User-Agent' => config('app.name', 'DiscoverLambo').'/1.0 (geocode)',
        ])
            ->timeout(12)
            ->get('https://nominatim.openstreetmap.org/search', [
                'q' => $query.', Lambayeque, Perú',
                'format' => 'json',
                'limit' => 1,
                'countrycodes' => 'pe',
            ]);

        if (! $response->successful()) {
            return null;
        }

        $hit = $response->json()[0] ?? null;
        if (! is_array($hit) || ! isset($hit['lat'], $hit['lon'])) {
            return null;
        }

        return [
            'lat' => round((float) $hit['lat'], 7),
            'lng' => round((float) $hit['lon'], 7),
        ];
    }
}
