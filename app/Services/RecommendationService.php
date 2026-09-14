<?php

namespace App\Services;

use App\Models\CuisineType;
use App\Models\Recommendation;
use App\Models\RecommendationRequest;
use App\Models\Restaurant;
use App\Models\User;
use App\Models\UserPreference;
use App\Support\RecsDebugLog;
use App\Support\RestaurantHoursPresenter;
use Illuminate\Support\Facades\Cache;

class RecommendationService
{
    public function __construct(
        private MlRecommendationClient $mlClient,
        private RestaurantExploreService $explore,
        private RestaurantHoursPresenter $hours,
    ) {}

    /**
     * @param  array<string, mixed>  $contextOverrides  lat, lng, etc.
     * @return array{items: list<array<string, mixed>>, meta: array<string, mixed>}
     */
    public function forUser(User $user, array $contextOverrides = [], int $topN = 0, bool $fresh = false): array
    {
        $enabled = $this->mlClient->isEnabled();
        $healthy = $enabled && $this->mlClient->isHealthy();

        if (! $enabled || ! $healthy) {
            RecsDebugLog::warning('ml_unavailable', [
                'user_id' => $user->id,
                'ml_enabled' => $enabled,
                'ml_healthy' => $healthy,
                'ml_url' => config('recommendations.ml_service_url'),
                'diagnosis' => ! $enabled
                    ? 'ML_SERVICE_ENABLED está apagado en .env'
                    : 'El servicio ML no responde /health (uvicorn caído, URL o API key distinta)',
            ]);

            return $this->unavailableResponse();
        }

        $topN = $topN > 0 ? $topN : (int) config('recommendations.default_top_n');
        $pref = $user->userPreferences()->latest('updated_at')->first();
        $user->loadMissing('touristProfile');
        $context = FallbackRecommendationEngine::contextFromUser($user, $pref, $contextOverrides);

        $version = (int) Cache::get($this->cacheVersionKey($user->id), 0);
        $cacheKey = sprintf(
            'ml_recommendations:%d:%d:%s',
            $user->id,
            $version,
            md5(json_encode($context).$topN)
        );

        if ($fresh) {
            Cache::forget($cacheKey);
        }

        $cached = Cache::get($cacheKey);
        if (is_array($cached) && ! $fresh) {
            RecsDebugLog::info('cache_hit', [
                'user_id' => $user->id,
                'cache_key' => $cacheKey,
                'item_names' => collect($cached['items'] ?? [])->pluck('name')->all(),
                'diagnosis' => 'Se reutilizó el resultado en caché (hasta 10 min). Pulsa actualizar recs o espera el TTL.',
            ]);

            return $cached;
        }

        $result = $this->generate($user, $context, $topN, $pref);

        if ($result['meta']['algorithm'] !== 'unavailable') {
            Cache::put($cacheKey, $result, (int) config('recommendations.cache_ttl_seconds'));
        }

        return $result;
    }

    /**
     * @return array{items: list<array<string, mixed>>, meta: array<string, mixed>}
     */
    private function generate(User $user, array $context, int $topN, ?UserPreference $pref): array
    {
        $fetchN = min(max($topN * 3, 30), 50);

        $payload = [
            'user_id' => $user->id,
            'context' => $this->mlContextPayload($context, $pref),
            'top_n' => $fetchN,
            'exclude_restaurant_ids' => [],
        ];

        $cuisineId = $context['cuisine_type_id'] ?? null;
        $cuisine = $cuisineId
            ? CuisineType::query()->find($cuisineId, ['id', 'name', 'slug'])
            : null;
        $matchingCuisineCount = $cuisineId
            ? Restaurant::query()
                ->where('is_active', true)
                ->where('is_verified', true)
                ->where(function ($q) use ($cuisineId) {
                    $q->where('cuisine_type_id', $cuisineId)
                        ->orWhereHas('cuisineTypes', fn ($cq) => $cq->where('cuisine_types.id', $cuisineId));
                })
                ->count()
            : null;

        RecsDebugLog::info('request', [
            'user_id' => $user->id,
            'profile_cuisines' => $user->touristProfile?->preferred_cuisines,
            'pref_id' => $pref?->id,
            'pref_cuisine_type_id' => $pref?->cuisine_type_id,
            'pref_cuisine_name' => $cuisine?->name,
            'pref_cuisine_slug' => $cuisine?->slug,
            'pref_price_range' => $pref?->price_range,
            'restaurants_matching_cuisine' => $matchingCuisineCount,
            'payload' => $payload,
        ]);

        $mlResponse = $this->mlClient->recommend($payload);

        if ($mlResponse === null) {
            RecsDebugLog::warning('ml_recommend_null', [
                'user_id' => $user->id,
                'diagnosis' => 'POST /api/v1/recommend falló o no devolvió JSON. Revisa URL, API key y logs del servicio Python.',
            ]);

            return $this->unavailableResponse();
        }

        $algorithm = (string) ($mlResponse['algorithm'] ?? 'hybrid');
        $coldStart = (bool) ($mlResponse['cold_start'] ?? false);
        $scored = collect($mlResponse['recommendations'] ?? [])->map(fn (array $row) => [
            'restaurant_id' => (int) $row['restaurant_id'],
            'rank' => (int) $row['rank'],
            'score' => (float) $row['score'],
        ]);

        RecsDebugLog::info('ml_response', [
            'user_id' => $user->id,
            'algorithm' => $algorithm,
            'cold_start' => $coldStart,
            'raw_keys' => array_keys($mlResponse),
            'returned_count' => $scored->count(),
            'returned_ids' => $scored->pluck('restaurant_id')->all(),
            'meta_extra' => collect($mlResponse)->except(['recommendations'])->all(),
        ]);

        if ($scored->isEmpty()) {
            RecsDebugLog::warning('ml_empty', [
                'user_id' => $user->id,
                'diagnosis' => 'El ML respondió OK pero sin restaurantes.',
            ]);

            return [
                'items' => [],
                'meta' => [
                    'algorithm' => $algorithm,
                    'cold_start' => $coldStart,
                    'ml_available' => true,
                    'request_id' => null,
                ],
            ];
        }

        $request = RecommendationRequest::create([
            'user_id' => $user->id,
            'budget' => $context['budget'] ?? $pref?->price_range,
            'party_type' => null,
        ]);

        $ids = $scored->pluck('restaurant_id')->all();
        $restaurants = Restaurant::query()
            ->with([
                'cuisineType:id,name',
                'cuisineTypes:id,name',
                'district:id,name',
                'images' => fn ($q) => $q->orderByDesc('is_cover')->limit(1),
                'schedules',
            ])
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        $items = [];
        $rank = 0;
        $skipped = [];
        $mlPreview = [];

        foreach ($scored as $row) {
            $restaurant = $restaurants->get($row['restaurant_id']);
            $mlPreview[] = [
                'id' => $row['restaurant_id'],
                'name' => $restaurant?->name,
                'primary_cuisine' => $restaurant?->cuisineType?->name,
                'cuisines' => $restaurant?->cuisineTypes->pluck('name')->all() ?? [],
                'score' => $row['score'],
                'open' => $restaurant ? $this->hours->isOpen($restaurant) : false,
            ];

            if (! $restaurant || ! $this->hours->isOpen($restaurant)) {
                $skipped[] = [
                    'id' => $row['restaurant_id'],
                    'name' => $restaurant?->name,
                    'reason' => $restaurant ? 'closed_now' : 'not_in_db',
                ];
                continue;
            }

            $rank++;
            Recommendation::create([
                'request_id' => $request->id,
                'restaurant_id' => $restaurant->id,
                'rank' => $rank,
                'score' => $row['score'],
            ]);

            $items[] = array_merge(
                $this->explore->formatCard($restaurant, $context['latitude'] ?? null, $context['longitude'] ?? null),
                [
                    'rank' => $rank,
                    'recommendation_score' => $this->displayRecommendationScore((float) $row['score']),
                ],
            );

            if (count($items) >= $topN) {
                break;
            }
        }

        $finalCuisines = collect($items)
            ->map(fn (array $item) => collect($item['cuisines'] ?? [])->pluck('name')->all())
            ->flatten()
            ->unique()
            ->values()
            ->all();

        RecsDebugLog::info('result', [
            'user_id' => $user->id,
            'algorithm' => $algorithm,
            'cold_start' => $coldStart,
            'requested_cuisine' => $cuisine?->slug,
            'restaurants_matching_cuisine' => $matchingCuisineCount,
            'ml_preview' => $mlPreview,
            'skipped' => $skipped,
            'final_names' => collect($items)->pluck('name')->all(),
            'final_cuisines' => $finalCuisines,
            'diagnosis' => $this->diagnoseMismatch(
                $cuisine?->slug,
                $cuisine?->name,
                $matchingCuisineCount,
                $coldStart,
                $algorithm,
                $mlPreview,
                $finalCuisines,
                $skipped,
                $user->touristProfile?->preferred_cuisines,
                $pref?->cuisine_type_id,
            ),
        ]);

        return [
            'items' => $items,
            'meta' => [
                'algorithm' => $algorithm,
                'cold_start' => $coldStart,
                'ml_available' => true,
                'request_id' => $request->id,
            ],
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $mlPreview
     * @param  list<string>  $finalCuisines
     * @param  list<array<string, mixed>>  $skipped
     * @param  list<string>|null  $profileCuisines
     */
    private function diagnoseMismatch(
        ?string $requestedSlug,
        ?string $requestedName,
        ?int $matchingCuisineCount,
        bool $coldStart,
        string $algorithm,
        array $mlPreview,
        array $finalCuisines,
        array $skipped,
        mixed $profileCuisines,
        mixed $prefCuisineId,
    ): string {
        if ($prefCuisineId === null && filled($profileCuisines)) {
            return 'El perfil tiene cocinas ('.json_encode($profileCuisines).') pero user_preferences.cuisine_type_id es null: el ML no recibe la cocina elegida.';
        }

        if ($requestedSlug === null) {
            return 'No hay cuisine_type_id en el contexto. El ML rankea por popularidad y por eso se ven siempre los mismos (marina/destacados).';
        }

        if ($matchingCuisineCount === 0) {
            return "Se pidió {$requestedName} ({$requestedSlug}) pero en esta BD hay 0 restaurantes activos de esa cocina.";
        }

        $mlCuisines = collect($mlPreview)
            ->flatMap(fn (array $row) => $row['cuisines'] ?? [])
            ->merge(collect($mlPreview)->pluck('primary_cuisine'))
            ->filter()
            ->unique();

        if ($coldStart) {
            return "ML en cold_start (algorithm={$algorithm}). Suele ignorar o debilitar la cocina y devolver populares.";
        }

        $askedInMl = $mlCuisines->contains(fn ($name) => strcasecmp((string) $name, (string) $requestedName) === 0);
        if (! $askedInMl) {
            return "El ML devolvió {$mlCuisines->implode(', ')} y no {$requestedName}, pese a haber {$matchingCuisineCount} locales de esa cocina. El modelo no está usando cuisine_type_id.";
        }

        $closedOfAsked = collect($skipped)->where('reason', 'closed_now')->count();
        if ($closedOfAsked > 0 && ! in_array($requestedName, $finalCuisines, true)) {
            return "El ML sí trajo {$requestedName}, pero Laravel los filtró por horario cerrado y en pantalla quedaron otras cocinas: ".implode(', ', $finalCuisines);
        }

        if ($finalCuisines !== [] && ! in_array($requestedName, $finalCuisines, true)) {
            return "La lista final no incluye {$requestedName}. Final: ".implode(', ', $finalCuisines);
        }

        return "OK: se pidió {$requestedName} y la lista es coherente ({$algorithm}).";
    }

    /**
     * @return array{items: list<array<string, mixed>>, meta: array<string, mixed>}
     */
    private function unavailableResponse(): array
    {
        return [
            'items' => [],
            'meta' => [
                'algorithm' => 'unavailable',
                'cold_start' => false,
                'ml_available' => false,
                'request_id' => null,
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    private function mlContextPayload(array $context, ?UserPreference $pref = null): array
    {
        return [
            'latitude' => $context['latitude'] ?? null,
            'longitude' => $context['longitude'] ?? null,
            'budget' => $context['budget'] ?? null,
            'price_ranges' => array_values($context['price_ranges'] ?? []),
            'budgets' => array_values($context['budgets'] ?? []),
            'party_type_ids' => $context['party_type_ids'] ?? [],
            'time_slot' => $context['time_slot'] ?? FallbackRecommendationEngine::inferTimeSlot($pref),
            'max_distance_km' => (float) ($context['max_distance_km'] ?? 15),
            'cuisine_type_id' => $context['cuisine_type_id'] ?? null,
            'ambiance_id' => $context['ambiance_id'] ?? null,
            'dietary_option_ids' => $context['dietary_option_ids'] ?? [],
            'restaurant_environment_ids' => $context['restaurant_environment_ids'] ?? [],
            'recommended_moment_ids' => $context['recommended_moment_ids'] ?? [],
            'service_ids' => $context['service_ids'] ?? [],
            'language_ids' => $context['language_ids'] ?? [],
            'min_rating' => $context['min_rating'] ?? null,
        ];
    }

    public function bustCacheForUser(User $user): void
    {
        Cache::increment($this->cacheVersionKey($user->id));
    }

    /** Convierte el score bruto del motor (0–1) a porcentaje visible (0–100). */
    private function displayRecommendationScore(float $score): int
    {
        return min(100, (int) round(max(0, $score) * 1000));
    }

    private function cacheVersionKey(int $userId): string
    {
        return "ml_rec_ver:{$userId}";
    }
}
