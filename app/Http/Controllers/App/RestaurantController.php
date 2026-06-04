<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Concerns\ResolvesScopedRestaurant;
use App\Http\Controllers\Controller;
use App\Models\Ambiance;
use App\Models\CuisineType;
use App\Models\Department;
use App\Models\DietaryOption;
use App\Models\PartyType;
use App\Models\RecommendedMoment;
use App\Models\Restaurant;
use App\Models\RestaurantEnvironment;
use App\Services\RestaurantCuisineService;
use App\Services\RestaurantScopeService;
use App\Support\OwnerPanel;
use App\Support\PriceRange;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RestaurantController extends Controller
{
    use ResolvesScopedRestaurant;

    public function index(Request $request, RestaurantScopeService $scope): Response
    {
        return $this->indexForRestaurant($request, $scope->forOwnerPanel($request), false);
    }

    public function indexForRestaurant(Request $request, Restaurant $restaurant, bool $admin = true): Response
    {
        if ($admin) {
            abort_unless(app(RestaurantScopeService::class)->canManageAsAdmin($request->user(), $restaurant), 403);
        }

        abort_unless($request->user()?->can('manage_own_restaurant'), 403);

        $restaurant->load([
            'cuisineType:id,name',
            'cuisineTypes:id,name',
            'ambiance:id,name',
            'partyTypes:id,name',
            'dietaryOptions:id,name',
            'restaurantEnvironments:id,name',
            'recommendedMoments:id,name',
            'district:id,name,province_id',
            'district.province:id,name,department_id',
            'district.province.department:id,name',
        ]);

        $departments = Department::query()
            ->with(['provinces' => fn ($q) => $q->orderBy('name')->with(['districts' => fn ($q2) => $q2->orderBy('name')])])
            ->orderBy('name')
            ->get(['id', 'name']);

        $district = $restaurant->district;

        return Inertia::render('app/restaurants', [
            ...OwnerPanel::props($restaurant, $admin),
            'restaurant' => $restaurant,
            'geoSelection' => [
                'department_id' => $district?->province?->department_id,
                'province_id' => $district?->province_id,
                'district_id' => $restaurant->district_id,
            ],
            'departments' => $departments,
            'cuisineTypes' => CuisineType::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'cuisineSelection' => [
                'ids' => $restaurant->cuisineTypes->pluck('id')->all(),
                'primary_id' => $restaurant->cuisineTypes->first(fn ($c) => $c->pivot->is_primary)?->id
                    ?? $restaurant->cuisine_type_id,
            ],
            'ambiances' => Ambiance::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'partyTypes' => PartyType::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'dietaryOptions' => DietaryOption::query()
                ->where('is_active', true)
                ->where('for_restaurant', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'restaurantEnvironments' => RestaurantEnvironment::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'recommendedMoments' => RecommendedMoment::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'audienceSelection' => [
                'party_type_ids' => $restaurant->partyTypes->pluck('id')->all(),
                'dietary_option_ids' => $restaurant->dietaryOptions->pluck('id')->all(),
                'restaurant_environment_ids' => $restaurant->restaurantEnvironments->pluck('id')->all(),
                'recommended_moment_ids' => $restaurant->recommendedMoments->pluck('id')->all(),
            ],
            'stats' => [
                'is_active' => (bool) $restaurant->is_active,
                'is_verified' => (bool) $restaurant->is_verified,
                'avg_rating' => (float) $restaurant->avg_rating,
                'total_reviews' => (int) $restaurant->total_reviews,
            ],
        ]);
    }

    public function update(
        Request $request,
        RestaurantScopeService $scope,
        RestaurantCuisineService $cuisineService,
        ?Restaurant $restaurant = null,
    ): RedirectResponse {
        abort_unless($request->user()?->can('manage_own_restaurant'), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'short_description' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'address' => ['nullable', 'string', 'max:255'],
            'district_id' => ['nullable', 'exists:districts,id'],
            'cuisine_type_ids' => ['nullable', 'array'],
            'cuisine_type_ids.*' => ['integer', 'exists:cuisine_types,id'],
            'primary_cuisine_type_id' => ['nullable', 'integer', 'exists:cuisine_types,id'],
            'ambiance_id' => ['nullable', 'exists:ambiances,id'],
            'party_type_ids' => ['nullable', 'array'],
            'party_type_ids.*' => ['integer', 'exists:party_types,id'],
            'dietary_option_ids' => ['nullable', 'array'],
            'dietary_option_ids.*' => ['integer', 'exists:dietary_options,id'],
            'restaurant_environment_ids' => ['nullable', 'array'],
            'restaurant_environment_ids.*' => ['integer', 'exists:restaurant_environments,id'],
            'recommended_moment_ids' => ['nullable', 'array'],
            'recommended_moment_ids.*' => ['integer', 'exists:recommended_moments,id'],
            'phone' => ['nullable', 'string', 'max:20'],
            'whatsapp' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:100'],
            'website' => ['nullable', 'string', 'max:255'],
            'price_range' => ['required', PriceRange::validationRule()],
            'avg_price_per_person' => ['nullable', 'numeric', 'min:0'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if ($error = PriceRange::avgPriceError($data['price_range'], $data['avg_price_per_person'] ?? null)) {
            return back()->withErrors(['avg_price_per_person' => $error])->withInput();
        }

        $restaurant = $this->scopedRestaurant($request, $scope, $restaurant);

        $cuisineIds = $data['cuisine_type_ids'] ?? [];
        $primaryCuisineId = $data['primary_cuisine_type_id'] ?? null;
        $partyTypeIds = $data['party_type_ids'] ?? [];
        $dietaryOptionIds = $data['dietary_option_ids'] ?? [];
        $environmentIds = $data['restaurant_environment_ids'] ?? [];
        $momentIds = $data['recommended_moment_ids'] ?? [];
        unset(
            $data['cuisine_type_ids'],
            $data['primary_cuisine_type_id'],
            $data['party_type_ids'],
            $data['dietary_option_ids'],
            $data['restaurant_environment_ids'],
            $data['recommended_moment_ids'],
        );

        $restaurant->update($data);
        $cuisineService->sync($restaurant, $cuisineIds, $primaryCuisineId);

        $validPartyIds = PartyType::query()
            ->where('is_active', true)
            ->whereIn('id', $partyTypeIds)
            ->pluck('id')
            ->all();
        $validDietaryIds = DietaryOption::query()
            ->where('is_active', true)
            ->where('for_restaurant', true)
            ->whereIn('id', $dietaryOptionIds)
            ->pluck('id')
            ->all();

        $validEnvironmentIds = RestaurantEnvironment::query()
            ->where('is_active', true)
            ->whereIn('id', $environmentIds)
            ->pluck('id')
            ->all();
        $validMomentIds = RecommendedMoment::query()
            ->where('is_active', true)
            ->whereIn('id', $momentIds)
            ->pluck('id')
            ->all();

        $restaurant->partyTypes()->sync($validPartyIds);
        $restaurant->dietaryOptions()->sync($validDietaryIds);
        $restaurant->restaurantEnvironments()->sync($validEnvironmentIds);
        $restaurant->recommendedMoments()->sync($validMomentIds);

        return back()->with('success', 'Datos del local actualizados.');
    }
}
