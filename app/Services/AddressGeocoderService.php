<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class AddressGeocoderService
{
    /** Chiclayo — sesgo por defecto para búsquedas en Lambayeque. */
    private const DEFAULT_LAT = -6.7766;

    private const DEFAULT_LNG = -79.8442;

    /** Viewbox Nominatim: minLon, maxLat, maxLon, minLat (Lambayeque / Chiclayo). */
    private const VIEWBOX = '-79.9800,-6.5200,-79.6200,-6.9800';

    /**
     * @return array{lat: float, lng: float}|null
     */
    public function geocode(
        string $address,
        ?float $biasLat = null,
        ?float $biasLng = null,
        ?string $district = null,
        ?string $province = null,
        ?string $department = null,
    ): ?array {
        $normalized = $this->normalizeAddress($address);
        if ($normalized === '') {
            return null;
        }

        $biasLat ??= self::DEFAULT_LAT;
        $biasLng ??= self::DEFAULT_LNG;

        $city = $district ?: ($province ?: 'Chiclayo');
        $state = $department ?: 'Lambayeque';

        foreach ($this->buildSearchAttempts($normalized, $city, $state) as $attempt) {
            $hits = $this->searchNominatim($attempt);
            $best = $this->pickBestHit($hits, $biasLat, $biasLng);

            if ($best !== null) {
                return [
                    'lat' => round((float) $best['lat'], 7),
                    'lng' => round((float) $best['lon'], 7),
                ];
            }
        }

        return null;
    }

    private function normalizeAddress(string $address): string
    {
        $query = trim(preg_replace('/\s+/u', ' ', $address) ?? '');

        $replacements = [
            '/\bav\.?\s+/iu' => 'Avenida ',
            '/\bavda\.?\s+/iu' => 'Avenida ',
            '/\bavn\.?\s+/iu' => 'Avenida ',
            '/\bjr\.?\s+/iu' => 'Jirón ',
            '/\bjirón\s+/iu' => 'Jirón ',
            '/\bcalle\s+/iu' => 'Calle ',
            '/\bpasaje\s+/iu' => 'Pasaje ',
            '/\burb\.?\s+/iu' => 'Urbanización ',
            '/\bprol\.?\s+/iu' => 'Prolongación ',
        ];

        foreach ($replacements as $pattern => $replacement) {
            $query = preg_replace($pattern, $replacement, $query) ?? $query;
        }

        return trim($query);
    }

    /**
     * @return list<array<string, string>>
     */
    private function buildSearchAttempts(string $normalized, string $city, string $state): array
    {
        $attempts = [];
        $parts = $this->parseAddressParts($normalized);
        $locality = $parts['locality'] ?: $city;

        $attempts[] = ['q' => $normalized];

        if (! $this->hasRegionHint($normalized)) {
            $attempts[] = ['q' => "{$normalized}, {$city}, {$state}, Perú"];
        }

        $attempts[] = [
            'street' => $parts['street'],
            'city' => $locality,
            'state' => $state,
            'country' => 'Perú',
        ];

        if (strcasecmp($locality, $city) !== 0) {
            $attempts[] = [
                'street' => $parts['street'],
                'city' => $city,
                'state' => $state,
                'country' => 'Perú',
            ];
        }

        $unique = [];
        foreach ($attempts as $attempt) {
            $key = json_encode($attempt);
            if (! isset($unique[$key])) {
                $unique[$key] = $attempt;
            }
        }

        return array_values($unique);
    }

    /**
     * @return array{street: string, locality: string|null}
     */
    private function parseAddressParts(string $normalized): array
    {
        $segments = array_values(array_filter(
            array_map(trim(...), explode(',', $normalized)),
            fn (string $part): bool => $part !== '',
        ));

        if ($segments === []) {
            return ['street' => $normalized, 'locality' => null];
        }

        $street = array_shift($segments);
        $locality = null;

        foreach ($segments as $segment) {
            if (preg_match('/\b(peru|perú)\b/iu', $segment)) {
                continue;
            }

            if (preg_match('/\b(lambayeque)\b/iu', $segment) && count($segments) > 1) {
                continue;
            }

            $locality ??= $segment;
        }

        return [
            'street' => $street,
            'locality' => $locality,
        ];
    }

    private function hasRegionHint(string $address): bool
    {
        return (bool) preg_match(
            '/\b(peru|perú|lambayeque|chiclayo|ferreñafe|motupe|picsi|pimentel|monsefú|monsefu|saña|sana)\b/iu',
            $address,
        );
    }

    /**
     * @param  array<string, string>  $params
     * @return list<array<string, mixed>>
     */
    private function searchNominatim(array $params): array
    {
        $response = Http::withHeaders([
            'User-Agent' => config('app.name', 'DiscoverLambo').'/1.0 (geocode)',
        ])
            ->timeout(12)
            ->get('https://nominatim.openstreetmap.org/search', [
                ...$params,
                'format' => 'json',
                'limit' => 5,
                'countrycodes' => 'pe',
                'viewbox' => self::VIEWBOX,
                'bounded' => 0,
            ]);

        if (! $response->successful()) {
            return [];
        }

        $hits = $response->json();

        return is_array($hits) ? $hits : [];
    }

    /**
     * @param  list<array<string, mixed>>  $hits
     * @return array<string, mixed>|null
     */
    private function pickBestHit(array $hits, float $biasLat, float $biasLng): ?array
    {
        $best = null;
        $bestScore = -INF;

        foreach ($hits as $hit) {
            if (! is_array($hit) || ! isset($hit['lat'], $hit['lon'])) {
                continue;
            }

            $lat = (float) $hit['lat'];
            $lng = (float) $hit['lon'];
            $distanceKm = $this->haversineKm($biasLat, $biasLng, $lat, $lng);
            $importance = (float) ($hit['importance'] ?? 0);
            $placeRank = (int) ($hit['place_rank'] ?? 30);
            $displayName = (string) ($hit['display_name'] ?? '');

            $score = ($importance * 10)
                - (min($distanceKm, 80) * 0.35)
                - (max(0, $placeRank - 22) * 0.02);

            if (stripos($displayName, 'Chiclayo') !== false) {
                $score += 1.5;
            }

            if (stripos($displayName, 'Lambayeque') !== false) {
                $score += 0.5;
            }

            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $hit;
            }
        }

        return $best;
    }

    private function haversineKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
