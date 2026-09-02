<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\FormatsTouristExplorePayload;
use App\Http\Controllers\Concerns\LoadsTouristProfileCatalogs;
use App\Http\Controllers\Concerns\PaginatesPublicRestaurants;
use App\Services\RecommendationService;
use App\Services\RestaurantExploreService;
use App\Services\UserPreferenceService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Laravel\Fortify\Features;

class WelcomeController extends Controller
{
    use FormatsTouristExplorePayload;
    use LoadsTouristProfileCatalogs;
    use PaginatesPublicRestaurants;

    public function __invoke(
        Request $request,
        RestaurantExploreService $explore,
        RecommendationService $recommendations,
        UserPreferenceService $preferences,
    ): mixed {
        $user = $request->user();

        if ($user?->hasRole('tourist') || ! $user) {
            $homePayload = [
                'canRegister' => Features::enabled(Features::registration()) && ! $user,
                'isTouristHome' => true,
                'cuisineTypes' => $explore->activeCuisines(),
            ];

            if ($user?->hasRole('tourist')) {
                $user->loadMissing('touristProfile');

                $context = array_filter([
                    'latitude' => $request->has('lat') ? $request->float('lat') : null,
                    'longitude' => $request->has('lng') ? $request->float('lng') : null,
                ], fn ($v) => $v !== null);

                $recommendationPayload = $recommendations->forUser($user, $context);

                return Inertia::render('welcome', [
                    ...$homePayload,
                    'canRegister' => false,
                    'profile' => $this->formatTouristProfile($user->touristProfile),
                    'mlPreference' => $this->formatMlPreference($preferences->activeFor($user)),
                    'recommendations' => $recommendationPayload['items'],
                    'recommendationMeta' => $recommendationPayload['meta'],
                ]);
            }

            $featured = $explore->publicQuery(Request::create('/', 'GET', ['sort' => 'featured']))
                ->limit(8)
                ->get()
                ->values()
                ->map(fn ($restaurant, int $index) => array_merge(
                    $explore->formatCard($restaurant),
                    [
                        'rank' => $index + 1,
                        'recommendation_score' => 0,
                    ],
                ))
                ->all();

            return Inertia::render('welcome', [
                ...$homePayload,
                'profile' => null,
                'mlPreference' => null,
                'recommendations' => $featured,
                'recommendationMeta' => ['request_id' => null, 'ml_available' => false],
            ]);
        }

        $perPage = in_array((int) $request->input('per_page'), [9, 12, 15, 24], true)
            ? (int) $request->input('per_page')
            : 12;

        $sort = $request->string('sort')->value() ?: 'featured';
        if (in_array($sort, ['nearby'], true)) {
            $sort = 'featured';
        }
        $request->merge(['sort' => $sort]);

        $filters = $explore->resolvePublicFilters($request, ['sort' => $sort]);

        $paginator = $this->paginatePublicRestaurants(
            $request,
            $explore,
            $perPage,
            fn ($r) => $explore->formatCard($r),
        );

        return Inertia::render('welcome', [
            'canRegister' => Features::enabled(Features::registration()) && ! $user,
            'isTouristHome' => false,
            'restaurants' => $paginator,
            'cuisineTypes' => $explore->activeCuisines(),
            'districts' => $explore->districtsWithRestaurants(),
            'ambiances' => $explore->activeAmbiances(),
            'priceRanges' => $explore->availablePriceRanges(),
            'filters' => $filters,
        ]);
    }
}
