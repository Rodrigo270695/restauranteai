<?php

namespace App\Services;

use App\Models\RecommendedMoment;
use App\Models\Restaurant;
use App\Models\User;
use App\Models\UserPreference;
use App\Support\RestaurantHoursPresenter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Motor PHP de respaldo cuando el microservicio ML no está disponible.
 */
class FallbackRecommendationEngine
{
    public function __construct(
        private RestaurantHoursPresenter $hours,
    ) {}

    /**
     * @param  array<string, mixed>  $context
     * @return Collection<int, array{restaurant_id: int, rank: int, score: float, algorithm: string}>
     */
    public function recommend(User $user, array $context, int $topN = 8): Collection
    {
        $pref = $user->userPreferences()->latest('updated_at')->first();

        $environmentIds = $context['restaurant_environment_ids'] ?? $pref?->restaurant_environment_ids ?? [];
        $momentIds = $context['recommended_moment_ids'] ?? $pref?->recommended_moment_ids ?? [];

        $query = Restaurant::query()
            ->where('is_active', true)
            ->where('is_verified', true)
            ->with(['restaurantEnvironments:id', 'recommendedMoments:id', 'schedules']);

        if ($pref?->min_rating) {
            $query->where('avg_rating', '>=', (float) $pref->min_rating);
        }

        if ($pref?->price_range) {
            $query->where('price_range', $pref->price_range);
        } elseif (! empty($context['budget'])) {
            $query->where('price_range', $context['budget']);
        }

        if ($pref?->cuisine_type_id) {
            $query->where(function (Builder $q) use ($pref) {
                $q->where('cuisine_type_id', $pref->cuisine_type_id)
                    ->orWhereHas('cuisineTypes', fn (Builder $c) => $c->where('cuisine_types.id', $pref->cuisine_type_id));
            });
        }

        if ($pref?->ambiance_id) {
            $query->where('ambiance_id', $pref->ambiance_id);
        }

        if (! empty($context['latitude']) && ! empty($context['longitude'])) {
            $lat = (float) $context['latitude'];
            $lng = (float) $context['longitude'];
            $maxKm = (float) ($context['max_distance_km'] ?? 15);
            $query->whereNotNull('latitude')->whereNotNull('longitude')
                ->selectRaw(
                    'restaurants.*, (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance_km',
                    [$lat, $lng, $lat]
                )
                ->having('distance_km', '<=', $maxKm);
        }

        $candidates = $query
            ->orderByDesc('is_featured')
            ->orderByDesc('avg_rating')
            ->orderByDesc('total_reviews')
            ->limit(max($topN * 6, 24))
            ->get();

        $preferredMomentSlugs = $momentIds !== []
            ? RecommendedMoment::query()->whereIn('id', $momentIds)->pluck('slug')->all()
            : [];

        $scored = $candidates
            ->filter(fn (Restaurant $restaurant) => $this->hours->isOpen($restaurant))
            ->map(function (Restaurant $restaurant) use ($environmentIds, $momentIds, $preferredMomentSlugs) {
            $score = ((float) $restaurant->avg_rating) / 5;
            if ($restaurant->is_featured) {
                $score += 0.08;
            }

            if ($environmentIds !== []) {
                $restEnvIds = $restaurant->restaurantEnvironments->pluck('id')->all();
                $overlap = count(array_intersect($environmentIds, $restEnvIds));
                $score += 0.2 * ($overlap / count($environmentIds));
            }

            if ($momentIds !== []) {
                $restMomentSlugs = $restaurant->recommendedMoments->pluck('slug')->all();
                $matched = count(array_intersect($preferredMomentSlugs, $restMomentSlugs));
                $score += 0.25 * ($matched / max(count($preferredMomentSlugs), 1));
            }

            if (isset($restaurant->distance_km)) {
                $dist = (float) $restaurant->distance_km;
                $score += max(0, 0.1 * (1 - min($dist, 15) / 15));
            }

            return [
                'restaurant' => $restaurant,
                'score' => round(min($score, 1.0), 4),
            ];
        })->sortByDesc('score')->values()->take($topN);

        return $scored->values()->map(fn (array $row, int $i) => [
            'restaurant_id' => $row['restaurant']->id,
            'rank' => $i + 1,
            'score' => $row['score'],
            'algorithm' => 'php_fallback',
        ]);
    }

    /**
     * @param  array<string, mixed>  $context
     */
    public static function contextFromUser(User $user, ?UserPreference $pref, array $overrides = []): array
    {
        $profile = $user->touristProfile;

        return array_merge([
            'latitude' => $overrides['latitude'] ?? null,
            'longitude' => $overrides['longitude'] ?? null,
            'budget' => $pref?->price_range ?? self::mapBudget($profile?->budget_preference),
            'max_distance_km' => $pref?->max_distance_km !== null ? (float) $pref->max_distance_km : 15,
            'cuisine_type_id' => $pref?->cuisine_type_id,
            'ambiance_id' => $pref?->ambiance_id,
            'party_type_ids' => $pref?->party_type_ids ?? [],
            'dietary_option_ids' => $pref?->dietary_option_ids ?? [],
            'restaurant_environment_ids' => $pref?->restaurant_environment_ids ?? [],
            'recommended_moment_ids' => $pref?->recommended_moment_ids ?? [],
            'service_ids' => $pref?->service_ids ?? [],
            'language_ids' => $pref?->language_ids ?? [],
            'min_rating' => $pref?->min_rating !== null ? (float) $pref->min_rating : null,
            'time_slot' => self::inferTimeSlot($pref),
        ], $overrides);
    }

    public static function mapBudget(?string $budget): ?string
    {
        return match ($budget) {
            'low' => 'economico',
            'medium' => 'moderado',
            'high' => 'premium',
            default => null,
        };
    }

    public static function inferTimeSlot(?UserPreference $pref = null): string
    {
        if ($pref?->recommended_moment_ids) {
            $priority = ['desayuno', 'almuerzo', 'brunch', 'cena', 'bar'];
            $slugs = RecommendedMoment::query()
                ->whereIn('id', $pref->recommended_moment_ids)
                ->pluck('slug')
                ->all();

            foreach ($priority as $candidate) {
                if (in_array($candidate, $slugs, true)) {
                    return $candidate;
                }
            }
        }

        $hour = (int) now()->format('H');

        return match (true) {
            $hour >= 6 && $hour < 11 => 'desayuno',
            $hour >= 11 && $hour < 16 => 'almuerzo',
            $hour >= 16 && $hour < 18 => 'snack',
            default => 'cena',
        };
    }
}
