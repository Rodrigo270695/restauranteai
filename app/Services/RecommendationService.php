<?php

namespace App\Services;

use App\Models\Recommendation;
use App\Models\RecommendationRequest;
use App\Models\Restaurant;
use App\Models\User;
use App\Models\UserPreference;
use App\Support\RestaurantHoursPresenter;
use Illuminate\Support\Facades\Cache;

class RecommendationService
{
    public function __construct(
        private MlRecommendationClient $mlClient,
        private FallbackRecommendationEngine $fallback,
        private RestaurantExploreService $explore,
        private RestaurantHoursPresenter $hours,
    ) {}

    /**
     * @param  array<string, mixed>  $contextOverrides  lat, lng, etc.
     * @return array{items: list<array<string, mixed>>, meta: array<string, mixed>}
     */
    public function forUser(User $user, array $contextOverrides = [], int $topN = 0, bool $fresh = false): array
    {
        $topN = $topN > 0 ? $topN : (int) config('recommendations.default_top_n');
        $pref = $user->userPreferences()->latest('updated_at')->first();
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

        return Cache::remember(
            $cacheKey,
            (int) config('recommendations.cache_ttl_seconds'),
            fn () => $this->generate($user, $context, $topN, $pref)
        );
    }

    /**
     * @return array{items: list<array<string, mixed>>, meta: array<string, mixed>}
     */
    private function generate(User $user, array $context, int $topN, $pref): array
    {
        $fetchN = min(max($topN * 3, 30), 50);

        $payload = [
            'user_id' => $user->id,
            'context' => $this->mlContextPayload($context, $pref),
            'top_n' => $fetchN,
            'exclude_restaurant_ids' => [],
        ];

        $mlResponse = $this->mlClient->recommend($payload);
        $algorithm = 'hybrid';
        $coldStart = false;
        $scored = collect();

        if ($mlResponse && ! empty($mlResponse['recommendations'])) {
            $algorithm = (string) ($mlResponse['algorithm'] ?? 'hybrid');
            $coldStart = (bool) ($mlResponse['cold_start'] ?? false);
            $scored = collect($mlResponse['recommendations'])->map(fn (array $row) => [
                'restaurant_id' => (int) $row['restaurant_id'],
                'rank' => (int) $row['rank'],
                'score' => (float) $row['score'],
            ]);
        } else {
            $scored = $this->fallback->recommend($user, $context, $topN);
            $algorithm = 'php_fallback';
            $coldStart = true;
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

        foreach ($scored as $row) {
            $restaurant = $restaurants->get($row['restaurant_id']);
            if (! $restaurant || ! $this->hours->isOpen($restaurant)) {
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

        return [
            'items' => $items,
            'meta' => [
                'algorithm' => $algorithm,
                'cold_start' => $coldStart,
                'ml_available' => $this->mlClient->isHealthy(),
                'request_id' => $request->id,
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
