<?php

namespace App\Http\Controllers;

use App\Http\Requests\Explore\UserPreferenceRequest;
use App\Models\Ambiance;
use App\Models\CuisineType;
use App\Services\UserPreferenceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class ExploreController extends Controller
{
    public function __construct(
        private UserPreferenceService $preferences,
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

        return Inertia::render('explore/index', [
            'profile' => $this->formatTouristProfile($profile),
            'mlPreference' => $this->formatMlPreference($activePreference),
            'tamCompleted' => $user->tamSurvey()->exists(),
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
            'mlPreference' => $activePreference ? [
                'cuisine_type_id' => $activePreference->cuisine_type_id,
                'ambiance_id' => $activePreference->ambiance_id,
                'price_range' => $activePreference->price_range,
                'max_distance_km' => $activePreference->max_distance_km !== null
                    ? (float) $activePreference->max_distance_km
                    : null,
                'party_type' => $activePreference->party_type,
                'dietary_restriction' => $activePreference->dietary_restriction,
            ] : null,
            'catalogs' => [
                'cuisineTypes' => CuisineType::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
                'ambiances' => Ambiance::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            ],
        ]);
    }

    /** Actualiza perfil turista y preferencias ML */
    public function updateProfile(UserPreferenceRequest $request): mixed
    {
        $user = $request->user();
        $validated = $request->validated();

        $touristData = array_filter([
            'city' => $validated['city'] ?? null,
            'bio' => $validated['bio'] ?? null,
            'budget_preference' => $validated['budget_preference'] ?? null,
            'preferred_cuisines' => $validated['preferred_cuisines'] ?? null,
        ], fn ($v) => $v !== null);

        $profile = $user->touristProfile()->updateOrCreate(
            ['user_id' => $user->id],
            [...$touristData, 'completed_at' => now()],
        );

        $priceRange = $validated['price_range']
            ?? $this->preferences->mapBudgetToPriceRange($validated['budget_preference'] ?? null);

        $preferencePayload = array_filter([
            'cuisine_type_id' => $validated['cuisine_type_id'] ?? null,
            'ambiance_id' => $validated['ambiance_id'] ?? null,
            'price_range' => $priceRange,
            'max_distance_km' => $validated['max_distance_km'] ?? null,
            'party_type' => $validated['party_type'] ?? null,
            'dietary_restriction' => $validated['dietary_restriction'] ?? null,
        ], fn ($v) => $v !== null && $v !== '');

        if ($preferencePayload !== []) {
            $this->preferences->record($user, $preferencePayload);
        } else {
            $this->preferences->syncFromTouristProfile($user, $profile);
        }

        return back()->with('success', true);
    }

    /** @return array<string, mixed>|null */
    private function formatTouristProfile(?\App\Models\TouristProfile $profile, bool $includeNulls = false): ?array
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
            'preferred_cuisines' => $profile->preferred_cuisines ?? [],
            'budget_preference' => $profile->budget_preference,
            'completed' => $profile->isCompleted(),
        ];
    }

    /** @return array<string, mixed>|null */
    private function formatMlPreference(?\App\Models\UserPreference $pref): ?array
    {
        if (! $pref) {
            return null;
        }

        return [
            'cuisine' => $pref->cuisineType?->name,
            'ambiance' => $pref->ambiance?->name,
            'price_range' => $pref->price_range,
            'party_type' => $pref->party_type,
            'dietary_restriction' => $pref->dietary_restriction,
            'max_distance_km' => $pref->max_distance_km !== null ? (float) $pref->max_distance_km : null,
        ];
    }
}
