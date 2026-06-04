<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\LoadsTouristProfileCatalogs;
use App\Http\Requests\Explore\UserPreferenceRequest;
use App\Models\Ambiance;
use App\Models\DietaryOption;
use App\Models\PartyType;
use App\Models\RecommendedMoment;
use App\Models\RestaurantEnvironment;
use App\Models\TouristProfile;
use App\Models\UserPreference;
use App\Support\BudgetPreference;
use App\Services\RecommendationService;
use App\Services\RestaurantExploreService;
use App\Services\UserPreferenceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class ExploreController extends Controller
{
    use LoadsTouristProfileCatalogs;

    public function __construct(
        private UserPreferenceService $preferences,
        private RestaurantExploreService $explore,
        private RecommendationService $recommendations,
    ) {}

    /** Portal principal del turista */
    public function index(Request $request): mixed
    {
        $user = $request->user();

        if (! $user->hasRole('tourist')) {
            return Redirect::route('dashboard');
        }

        $profile = $user->touristProfile;
        $activePreference = $this->preferences->activeFor($user);

        $context = array_filter([
            'latitude' => $request->has('lat') ? $request->float('lat') : null,
            'longitude' => $request->has('lng') ? $request->float('lng') : null,
        ], fn ($v) => $v !== null);

        $recommendationPayload = $this->recommendations->forUser($user, $context);

        return Inertia::render('explore/index', [
            'profile' => $this->formatTouristProfile($profile),
            'mlPreference' => $this->formatMlPreference($activePreference),
            'tamCompleted' => $user->tamSurvey()->exists(),
            'recommendations' => $recommendationPayload['items'],
            'recommendationMeta' => $recommendationPayload['meta'],
            'cuisineTypes' => $this->activeCuisineTypes(),
        ]);
    }

    /** Vista de edición del perfil turista */
    public function profile(Request $request): mixed
    {
        $user = $request->user();

        if (! $user->hasRole('tourist')) {
            return Redirect::route('dashboard');
        }

        $profile = $user->touristProfile;
        $activePreference = $this->preferences->activeFor($user);

        return Inertia::render('explore/profile', [
            'profile' => $this->formatTouristProfile($profile, includeNulls: true),
            'mlPreference' => $this->formatMlPreferenceForForm($activePreference),
            'catalogs' => [
                'cuisineTypes' => $this->activeCuisineTypes(),
                'ambiances' => Ambiance::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
                'districts' => $this->lambayequeDistricts(),
                'budgetOptions' => $this->budgetOptions(),
                'priceRanges' => $this->catalogPriceRanges($this->explore),
                'services' => $this->activeServices(),
                'languages' => $this->activeSupportLanguages(),
                'partyTypes' => $this->activePartyTypes(),
                'dietaryOptions' => $this->activeDietaryOptionsForTourist(),
                'restaurantEnvironments' => $this->activeRestaurantEnvironments(),
                'recommendedMoments' => $this->activeRecommendedMoments(),
            ],
        ]);
    }

    /** Actualiza perfil turista y preferencias ML */
    public function updateProfile(UserPreferenceRequest $request): mixed
    {
        $user = $request->user();
        $validated = $request->validated();

        $preferredSlugs = isset($validated['preferred_cuisines'])
            ? $this->normalizePreferredCuisineSlugs($validated['preferred_cuisines'])
            : null;

        $budgetPreference = BudgetPreference::normalize($validated['budget_preference'] ?? null);

        $touristData = array_filter([
            'city' => $validated['city'] ?? null,
            'bio' => $validated['bio'] ?? null,
            'budget_preference' => $budgetPreference !== [] ? $budgetPreference : null,
            'preferred_cuisines' => $preferredSlugs,
        ], fn ($v) => $v !== null);

        $profile = $user->touristProfile()->updateOrCreate(
            ['user_id' => $user->id],
            [...$touristData, 'completed_at' => now()],
        );

        $priceRange = $validated['price_range']
            ?? BudgetPreference::singlePriceRange($budgetPreference);

        $cuisineTypeId = $validated['cuisine_type_id']
            ?? $this->preferences->primaryCuisineTypeIdFromSlugs($preferredSlugs ?? []);

        $preferencePayload = array_filter([
            'cuisine_type_id' => $cuisineTypeId,
            'ambiance_id' => $validated['ambiance_id'] ?? null,
            'price_range' => $priceRange,
            'max_distance_km' => $validated['max_distance_km'] ?? null,
            'party_type_ids' => $this->normalizePartyTypeIds($validated['party_type_ids'] ?? []),
            'dietary_option_ids' => $this->normalizeDietaryOptionIds($validated['dietary_option_ids'] ?? []),
            'restaurant_environment_ids' => $this->normalizeRestaurantEnvironmentIds($validated['restaurant_environment_ids'] ?? []),
            'recommended_moment_ids' => $this->normalizeRecommendedMomentIds($validated['recommended_moment_ids'] ?? []),
            'service_ids' => $validated['service_ids'] ?? null,
            'language_ids' => $validated['language_ids'] ?? null,
            'min_rating' => $validated['min_rating'] ?? null,
        ], fn ($v) => $v !== null && $v !== '' && $v !== []);

        if ($preferencePayload !== []) {
            $this->preferences->record($user, $preferencePayload);
        } else {
            $this->preferences->syncFromTouristProfile($user, $profile);
        }

        return back()->with('success', '¡Perfil actualizado correctamente!');
    }

    /** @return array<string, mixed>|null */
    private function formatTouristProfile(?TouristProfile $profile, bool $includeNulls = false): ?array
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
    private function formatMlPreference(?UserPreference $pref): ?array
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

    /** @return array<string, mixed>|null */
    private function formatMlPreferenceForForm(?UserPreference $pref): ?array
    {
        if (! $pref) {
            return null;
        }

        return [
            'cuisine_type_id' => $pref->cuisine_type_id,
            'ambiance_id' => $pref->ambiance_id,
            'price_range' => $pref->price_range,
            'max_distance_km' => $pref->max_distance_km !== null
                ? (float) $pref->max_distance_km
                : null,
            'party_type_ids' => $pref->party_type_ids ?? [],
            'dietary_option_ids' => $pref->dietary_option_ids ?? [],
            'restaurant_environment_ids' => $pref->restaurant_environment_ids ?? [],
            'recommended_moment_ids' => $pref->recommended_moment_ids ?? [],
            'service_ids' => $pref->service_ids ?? [],
            'language_ids' => $pref->language_ids ?? [],
            'min_rating' => $pref->min_rating !== null ? (float) $pref->min_rating : null,
        ];
    }

    /**
     * @param  list<int>  $ids
     * @return list<int>
     */
    private function normalizePartyTypeIds(array $ids): array
    {
        return PartyType::query()
            ->where('is_active', true)
            ->whereIn('id', $ids)
            ->pluck('id')
            ->all();
    }

    /**
     * @param  list<int>  $ids
     * @return list<int>
     */
    private function normalizeDietaryOptionIds(array $ids): array
    {
        $valid = DietaryOption::query()
            ->where('is_active', true)
            ->where('for_tourist_preference', true)
            ->whereIn('id', $ids)
            ->get(['id', 'slug']);

        $ninguna = $valid->firstWhere('slug', 'ninguna');

        if ($ninguna && $valid->count() > 1) {
            return [$ninguna->id];
        }

        return $valid->pluck('id')->all();
    }

    /**
     * @param  list<int>  $ids
     * @return list<int>
     */
    private function normalizeRestaurantEnvironmentIds(array $ids): array
    {
        return RestaurantEnvironment::query()
            ->where('is_active', true)
            ->whereIn('id', $ids)
            ->pluck('id')
            ->all();
    }

    /**
     * @param  list<int>  $ids
     * @return list<int>
     */
    private function normalizeRecommendedMomentIds(array $ids): array
    {
        return RecommendedMoment::query()
            ->where('is_active', true)
            ->whereIn('id', $ids)
            ->pluck('id')
            ->all();
    }

    /**
     * @param  list<int>  $ids
     * @return list<string>
     */
    private function partyTypeNames(array $ids): array
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
    private function dietaryOptionNames(array $ids): array
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
    private function restaurantEnvironmentNames(array $ids): array
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
    private function recommendedMomentNames(array $ids): array
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
