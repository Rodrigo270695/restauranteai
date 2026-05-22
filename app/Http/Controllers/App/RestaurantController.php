<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Concerns\ResolvesScopedRestaurant;
use App\Http\Controllers\Controller;
use App\Models\Ambiance;
use App\Models\CuisineType;
use App\Models\Department;
use App\Models\Restaurant;
use App\Services\RestaurantCuisineService;
use App\Services\RestaurantScopeService;
use App\Support\OwnerPanel;
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
            'phone' => ['nullable', 'string', 'max:20'],
            'whatsapp' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:100'],
            'website' => ['nullable', 'string', 'max:255'],
            'price_range' => ['required', 'in:economico,moderado,premium'],
            'avg_price_per_person' => ['nullable', 'numeric', 'min:0'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $restaurant = $this->scopedRestaurant($request, $scope, $restaurant);

        $cuisineIds = $data['cuisine_type_ids'] ?? [];
        $primaryCuisineId = $data['primary_cuisine_type_id'] ?? null;
        unset($data['cuisine_type_ids'], $data['primary_cuisine_type_id']);

        $restaurant->update($data);
        $cuisineService->sync($restaurant, $cuisineIds, $primaryCuisineId);

        return back()->with('success', 'Datos del local actualizados.');
    }
}
