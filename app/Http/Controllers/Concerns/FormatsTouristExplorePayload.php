<?php

namespace App\Http\Controllers\Concerns;

use App\Models\DietaryOption;
use App\Models\PartyType;
use App\Models\RecommendedMoment;
use App\Models\RestaurantEnvironment;
use App\Models\TouristProfile;
use App\Models\UserPreference;
use App\Support\BudgetPreference;

trait FormatsTouristExplorePayload
{
    /** @return array<string, mixed>|null */
    protected function formatTouristProfile(?TouristProfile $profile, bool $includeNulls = false): ?array
    {
        if (! $profile && ! $includeNulls) {
            return null;
        }

        if (! $profile) {
            return [
                'city' => null,
                'bio' => null,
                'preferred_cuisines' => [],
                'budget_preference' => null,
                'completed' => false,
            ];
        }

        return [
            'city' => $profile->city,
            'bio' => $profile->bio,
            'preferred_cuisines' => $this->normalizePreferredCuisineSlugs($profile->preferred_cuisines ?? []),
            'budget_preference' => BudgetPreference::normalize($profile->budget_preference),
            'completed' => $profile->isCompleted(),
        ];
    }

    /** @return array<string, mixed>|null */
    protected function formatMlPreference(?UserPreference $pref): ?array
    {
        if (! $pref) {
            return null;
        }

        return [
            'cuisine' => $pref->cuisineType?->name,
            'ambiance' => $pref->ambiance?->name,
            'price_range' => $pref->price_range,
            'party_types' => $this->partyTypeNames($pref->party_type_ids ?? []),
            'dietary_options' => $this->dietaryOptionNames($pref->dietary_option_ids ?? []),
            'restaurant_environments' => $this->restaurantEnvironmentNames($pref->restaurant_environment_ids ?? []),
            'recommended_moments' => $this->recommendedMomentNames($pref->recommended_moment_ids ?? []),
            'max_distance_km' => $pref->max_distance_km !== null ? (float) $pref->max_distance_km : null,
            'min_rating' => $pref->min_rating !== null ? (float) $pref->min_rating : null,
        ];
    }

    /**
     * @param  list<int>  $ids
     * @return list<string>
     */
    protected function partyTypeNames(array $ids): array
    {
        if ($ids === []) {
            return [];
        }

        return PartyType::query()
            ->whereIn('id', $ids)
            ->orderBy('name')
            ->pluck('name')
            ->all();
    }

    /**
     * @param  list<int>  $ids
     * @return list<string>
     */
    protected function dietaryOptionNames(array $ids): array
    {
        if ($ids === []) {
            return [];
        }

        return DietaryOption::query()
            ->whereIn('id', $ids)
            ->orderBy('name')
            ->pluck('name')
            ->all();
    }

    /**
     * @param  list<int>  $ids
     * @return list<string>
     */
    protected function restaurantEnvironmentNames(array $ids): array
    {
        if ($ids === []) {
            return [];
        }

        return RestaurantEnvironment::query()
            ->whereIn('id', $ids)
            ->orderBy('name')
            ->pluck('name')
            ->all();
    }

    /**
     * @param  list<int>  $ids
     * @return list<string>
     */
    protected function recommendedMomentNames(array $ids): array
    {
        if ($ids === []) {
            return [];
        }

        return RecommendedMoment::query()
            ->whereIn('id', $ids)
            ->orderBy('name')
            ->pluck('name')
            ->all();
    }
}
