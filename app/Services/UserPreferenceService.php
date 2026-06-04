<?php

namespace App\Services;

use App\Models\CuisineType;
use App\Models\TouristProfile;
use App\Models\User;
use App\Models\UserPreference;
use App\Support\BudgetPreference;
use App\Support\PriceRange;

class UserPreferenceService
{
    /** Preferencia activa = registro más reciente por updated_at. */
    public function activeFor(User $user): ?UserPreference
    {
        return $user->userPreferences()
            ->with(['cuisineType:id,name', 'ambiance:id,name'])
            ->latest('updated_at')
            ->first();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function record(User $user, array $data): UserPreference
    {
        return $user->userPreferences()->create($data);
    }

    /**
     * Sincroniza preferencias ML desde el perfil turista (setup / explore profile).
     */
    public function syncFromTouristProfile(User $user, TouristProfile $profile): ?UserPreference
    {
        $cuisineTypeId = null;
        $preferred = $profile->preferred_cuisines ?? [];

        if (is_array($preferred) && $preferred !== []) {
            $slugs = collect($preferred)
                ->map(fn ($v) => str((string) $v)->slug()->toString())
                ->filter()
                ->values()
                ->all();

            $cuisineTypeId = CuisineType::query()
                ->where('is_active', true)
                ->whereIn('slug', $slugs)
                ->value('id');

            if ($cuisineTypeId === null) {
                $cuisineTypeId = CuisineType::query()
                    ->where('is_active', true)
                    ->whereIn('name', $preferred)
                    ->value('id');
            }
        }

        $priceRange = BudgetPreference::singlePriceRange($profile->budget_preference);

        if ($cuisineTypeId === null && $priceRange === null) {
            return null;
        }

        return $this->record($user, [
            'cuisine_type_id' => $cuisineTypeId,
            'price_range' => $priceRange,
        ]);
    }

    /**
     * @param  list<string>  $slugs
     */
    public function primaryCuisineTypeIdFromSlugs(array $slugs): ?int
    {
        $first = $slugs[0] ?? null;

        if ($first === null || $first === '') {
            return null;
        }

        return CuisineType::query()
            ->where('is_active', true)
            ->where('slug', $first)
            ->value('id');
    }

    public function mapBudgetToPriceRange(?string $budget): ?string
    {
        return BudgetPreference::singlePriceRange($budget);
    }

    /**
     * @return list<string>
     */
    public function mapBudgetsToPriceRanges(mixed $budgets): array
    {
        return BudgetPreference::toPriceRanges($budgets);
    }

    public function mapPriceRangeToBudget(?string $priceRange): ?string
    {
        return match ($priceRange) {
            'economico' => 'low',
            'moderado' => 'medium',
            PriceRange::CARO, 'premium' => 'high',
            default => null,
        };
    }
}
