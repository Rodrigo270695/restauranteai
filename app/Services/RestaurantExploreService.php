<?php

namespace App\Services;

use App\Models\Ambiance;
use App\Models\CuisineType;
use App\Models\Restaurant;
use App\Support\PriceRange;
use App\Support\PublicStorage;
use App\Support\RestaurantHoursPresenter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class RestaurantExploreService
{
    public function __construct(
        private GeoDistanceService $geo,
        private RestaurantHoursPresenter $hours,
    ) {}

    /** @return Builder<Restaurant> */
    public function publicQuery(Request $request): Builder
    {
        $query = Restaurant::query()
            ->where('is_active', true)
            ->where('is_verified', true)
            ->with([
                'cuisineTypes:id,name',
                'cuisineType:id,name',
                'district:id,name',
                'images' => fn ($q) => $q->where('is_cover', true)->limit(1),
                'schedules',
            ]);

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('short_description', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }

        if ($cuisine = $request->integer('cuisine_type_id')) {
            $query->where(function (Builder $q) use ($cuisine) {
                $q->where('cuisine_type_id', $cuisine)
                    ->orWhereHas('cuisineTypes', fn (Builder $cq) => $cq->where('cuisine_types.id', $cuisine));
            });
        }

        if ($price = $request->string('price_range')->value()) {
            $query->where('price_range', $price);
        }

        if ($district = $request->integer('district_id')) {
            $query->where('district_id', $district);
        }

        if ($ambiance = $request->integer('ambiance_id')) {
            $query->where('ambiance_id', $ambiance);
        }

        if ($request->has('min_rating')) {
            $minRating = $request->float('min_rating');
            if ($minRating >= 1 && $minRating <= 5) {
                $query->where('avg_rating', '>=', $minRating);
            }
        }

        if ($request->boolean('featured_only')) {
            $query->where('is_featured', true);
        }

        $sort = $request->string('sort')->value();
        $lat = $this->validatedLatitude($request);
        $lng = $this->validatedLongitude($request);

        if ($sort === 'nearby' && $lat !== null && $lng !== null) {
            return $query->whereNotNull('latitude')->whereNotNull('longitude');
        }
        if ($sort === 'name') {
            return $query->orderBy('name');
        }
        if ($sort === 'rating') {
            return $query->orderByDesc('avg_rating');
        }

        return $query->orderByDesc('is_featured')->orderByDesc('avg_rating');
    }

    public function parseUserCoordinates(Request $request): array
    {
        $lat = $this->validatedLatitude($request);
        $lng = $this->validatedLongitude($request);

        return ['lat' => $lat, 'lng' => $lng];
    }

    /**
     * Ordena por distancia al usuario y descarta los que superan el radio (km).
     *
     * @param  Collection<int, Restaurant>  $restaurants
     * @return Collection<int, Restaurant>
     */
    public function sortByDistance(Collection $restaurants, float $lat, float $lng, float $maxKm = 50): Collection
    {
        return $this->rankByDistance($restaurants, $lat, $lng)
            ->filter(fn (Restaurant $r) => $r->distance_km <= $maxKm)
            ->values();
    }

    /**
     * Calcula distancia y ordena de menor a mayor (sin filtrar por radio).
     *
     * @param  Collection<int, Restaurant>  $restaurants
     * @return Collection<int, Restaurant>
     */
    public function rankByDistance(Collection $restaurants, float $lat, float $lng): Collection
    {
        return $restaurants
            ->filter(fn (Restaurant $r) => $r->latitude && $r->longitude)
            ->map(function (Restaurant $restaurant) use ($lat, $lng) {
                $restaurant->distance_km = $this->geo->kmBetween(
                    $lat,
                    $lng,
                    (float) $restaurant->latitude,
                    (float) $restaurant->longitude,
                );

                return $restaurant;
            })
            ->sortBy('distance_km')
            ->values();
    }

    /**
     * Cercanos priorizando locales abiertos (o agregables) y luego distancia.
     *
     * @param  Collection<int, Restaurant>  $restaurants
     * @return Collection<int, Restaurant>
     */
    public function rankByProximityPreference(Collection $restaurants, float $lat, float $lng): Collection
    {
        $ranked = $restaurants
            ->filter(fn (Restaurant $r) => $r->latitude && $r->longitude)
            ->map(function (Restaurant $restaurant) use ($lat, $lng) {
                $restaurant->distance_km = $this->geo->kmBetween(
                    $lat,
                    $lng,
                    (float) $restaurant->latitude,
                    (float) $restaurant->longitude,
                );

                return $restaurant;
            })
            ->values();

        return $ranked
            ->sort(function (Restaurant $a, Restaurant $b) {
                $aAvailable = $this->hours->isAvailableForRouteNow($a) ? 0 : 1;
                $bAvailable = $this->hours->isAvailableForRouteNow($b) ? 0 : 1;

                if ($aAvailable !== $bAvailable) {
                    return $aAvailable <=> $bAvailable;
                }

                return ($a->distance_km ?? PHP_FLOAT_MAX) <=> ($b->distance_km ?? PHP_FLOAT_MAX);
            })
            ->values();
    }

    /**
     * Los N más cercanos primero (abiertos primero); el resto en orden editorial.
     *
     * @param  Collection<int, Restaurant>  $restaurants
     * @return Collection<int, Restaurant>
     */
    public function orderWithNearbyFirst(
        Collection $restaurants,
        float $lat,
        float $lng,
        int $nearbyLimit = 30,
    ): Collection {
        $nearby = $this->rankByProximityPreference($restaurants, $lat, $lng)->take($nearbyLimit);
        $nearbyIds = $nearby->pluck('id')->all();

        $remaining = $restaurants
            ->reject(fn (Restaurant $r) => in_array($r->id, $nearbyIds, true))
            ->sortBy([
                fn (Restaurant $r) => $this->hours->isAvailableForRouteNow($r) ? 0 : 1,
                fn (Restaurant $r) => $r->is_featured ? 0 : 1,
                fn (Restaurant $r) => - (float) $r->avg_rating,
                fn (Restaurant $r) => $r->name,
            ])
            ->values();

        return $nearby->concat($remaining)->values();
    }

    private function validatedLatitude(Request $request): ?float
    {
        if (! $request->has('lat')) {
            return null;
        }
        $lat = $request->float('lat');

        return $lat >= -90 && $lat <= 90 ? $lat : null;
    }

    private function validatedLongitude(Request $request): ?float
    {
        if (! $request->has('lng')) {
            return null;
        }
        $lng = $request->float('lng');

        return $lng >= -180 && $lng <= 180 ? $lng : null;
    }

    public function formatCard(Restaurant $restaurant, ?float $userLat = null, ?float $userLng = null): array
    {
        $cover = $restaurant->images->first();

        $cuisines = $restaurant->cuisineTypes->isNotEmpty()
            ? $restaurant->cuisineTypes
            : ($restaurant->cuisineType ? collect([$restaurant->cuisineType]) : collect());

        $distanceKm = isset($restaurant->distance_km)
            ? round((float) $restaurant->distance_km, 2)
            : null;
        if ($distanceKm === null && $userLat && $userLng && $restaurant->latitude && $restaurant->longitude) {
            $distanceKm = $this->geo->kmBetween(
                $userLat,
                $userLng,
                (float) $restaurant->latitude,
                (float) $restaurant->longitude,
            );
        }

        return [
            'id' => $restaurant->id,
            'name' => $restaurant->name,
            'slug' => $restaurant->slug,
            'short_description' => $restaurant->short_description,
            'price_range' => $restaurant->price_range,
            'price_range_label' => $this->priceRangeLabel($restaurant->price_range),
            'avg_price_per_person' => $restaurant->avg_price_per_person !== null
                ? (float) $restaurant->avg_price_per_person
                : null,
            'avg_rating' => round((float) $restaurant->avg_rating, 1),
            'total_reviews' => (int) $restaurant->total_reviews,
            'cover_url' => PublicStorage::url($cover?->path ?? $restaurant->cover_image),
            'district' => $restaurant->district?->name,
            'latitude' => $restaurant->latitude !== null ? (float) $restaurant->latitude : null,
            'longitude' => $restaurant->longitude !== null ? (float) $restaurant->longitude : null,
            'distance_km' => $distanceKm,
            'cuisines' => $cuisines->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'is_primary' => (bool) ($c->pivot->is_primary ?? ($c->id === $restaurant->cuisine_type_id)),
            ])->values()->all(),
            'is_featured' => (bool) $restaurant->is_featured,
            'hours' => $this->hours->forSchedules($restaurant->schedules),
        ];
    }

    /** @return Collection<int, array<string, mixed>> */
    public function mapMarkers(Collection $restaurants): Collection
    {
        return $restaurants
            ->filter(fn (Restaurant $r) => $r->latitude && $r->longitude)
            ->map(fn (Restaurant $r) => [
                'id' => $r->id,
                'slug' => $r->slug,
                'name' => $r->name,
                'lat' => (float) $r->latitude,
                'lng' => (float) $r->longitude,
            ]);
    }

    public function isRestaurantOpen(Restaurant $restaurant): bool
    {
        return $this->hours->isOpen($restaurant);
    }

    /**
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    public function resolvePublicFilters(Request $request, array $extra = []): array
    {
        $priceRanges = $this->availablePriceRanges();
        $allowedPrices = collect($priceRanges)->pluck('value')->all();
        $priceRange = $request->string('price_range')->value() ?: null;
        if ($priceRange && ! in_array($priceRange, $allowedPrices, true)) {
            $priceRange = null;
        }

        $minRating = null;
        if ($request->has('min_rating')) {
            $candidate = round($request->float('min_rating'), 1);
            foreach ([3, 3.5, 4, 4.5] as $allowed) {
                if (abs($candidate - $allowed) < 0.01) {
                    $minRating = $allowed;
                    break;
                }
            }
        }

        $maxDistanceKm = null;
        if ($request->has('max_distance_km')) {
            $km = $request->integer('max_distance_km');
            if (in_array($km, [5, 10, 25, 50], true)) {
                $maxDistanceKm = $km;
            }
        }

        return array_merge([
            'search' => $request->string('search')->value(),
            'cuisine_type_id' => $request->integer('cuisine_type_id') ?: null,
            'price_range' => $priceRange,
            'district_id' => $request->integer('district_id') ?: null,
            'ambiance_id' => $request->integer('ambiance_id') ?: null,
            'min_rating' => $minRating,
            'open_now' => $request->boolean('open_now'),
            'featured_only' => $request->boolean('featured_only'),
            'max_distance_km' => $maxDistanceKm,
        ], $extra);
    }

    public function activeCuisines(): Collection
    {
        return CuisineType::query()
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereHas('restaurants', fn (Builder $r) => $this->publicRestaurantScope($r))
                    ->orWhereHas('restaurantsMany', fn (Builder $r) => $this->publicRestaurantScope($r));
            })
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);
    }

    public function activeAmbiances(): Collection
    {
        return Ambiance::query()
            ->where('is_active', true)
            ->whereHas('restaurants', fn (Builder $r) => $this->publicRestaurantScope($r))
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    /** Distritos Lambayeque con al menos un restaurante público. */
    public function districtsWithRestaurants(): Collection
    {
        return \App\Models\District::query()
            ->whereHas('province.department', fn ($q) => $q->where('code', '14'))
            ->whereHas('restaurants', fn (Builder $r) => $this->publicRestaurantScope($r))
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    /**
     * Rangos de precio presentes en restaurantes activos/verificados.
     *
     * @return list<array{value: string, label: string, name: string}>
     */
    public function availablePriceRanges(): array
    {
        $names = collect(PriceRange::VALUES)
            ->mapWithKeys(fn (string $key) => [$key => PriceRange::label($key)])
            ->all();

        $found = Restaurant::query()
            ->where('is_active', true)
            ->where('is_verified', true)
            ->whereNotNull('price_range')
            ->distinct()
            ->pluck('price_range')
            ->map(fn (?string $v) => $v === 'premium' ? PriceRange::CARO : $v)
            ->all();

        return collect(PriceRange::VALUES)
            ->filter(fn (string $key) => in_array($key, $found, true))
            ->map(function (string $key) use ($names) {
                $minPrice = Restaurant::query()
                    ->where('is_active', true)
                    ->where('is_verified', true)
                    ->whereIn('price_range', $key === PriceRange::CARO ? [PriceRange::CARO, 'premium'] : [$key])
                    ->whereNotNull('avg_price_per_person')
                    ->min('avg_price_per_person');

                return [
                    'value' => $key,
                    'label' => $minPrice !== null
                        ? 'S/ '.(int) round((float) $minPrice)
                        : '—',
                    'name' => $names[$key],
                ];
            })
            ->values()
            ->all();
    }

    private function priceRangeLabel(?string $priceRange): ?string
    {
        return PriceRange::label($priceRange);
    }

    private function publicRestaurantScope(Builder $query): Builder
    {
        return $query->where('is_active', true)->where('is_verified', true);
    }
}
