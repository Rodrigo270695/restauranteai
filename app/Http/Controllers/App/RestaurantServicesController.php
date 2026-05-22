<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Concerns\ResolvesScopedRestaurant;
use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use App\Models\Service;
use App\Services\RestaurantScopeService;
use App\Support\OwnerPanel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RestaurantServicesController extends Controller
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

        abort_unless($request->user()?->can('manage_restaurant_services'), 403);

        $items = Service::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'icon']);

        $selectedIds = $restaurant->services()->pluck('services.id')->all();

        return Inertia::render('app/restaurant-services', [
            ...OwnerPanel::props($restaurant, $admin),
            'saveUrl' => OwnerPanel::saveUrl($restaurant, $admin, $admin ? '/services' : '/restaurant-services'),
            'items' => $items,
            'selectedIds' => $selectedIds,
            'stats' => [
                'total' => $items->count(),
                'selected' => count($selectedIds),
            ],
        ]);
    }

    public function sync(Request $request, RestaurantScopeService $scope, ?Restaurant $restaurant = null): RedirectResponse
    {
        abort_unless($request->user()?->can('manage_restaurant_services'), 403);

        $ids = $request->validate([
            'ids' => ['present', 'array'],
            'ids.*' => ['integer', 'exists:services,id'],
        ])['ids'];

        $validIds = Service::query()
            ->where('is_active', true)
            ->whereIn('id', $ids)
            ->pluck('id')
            ->all();

        $restaurant = $this->scopedRestaurant($request, $scope, $restaurant);
        $restaurant->services()->sync($validIds);

        return back()->with('success', 'Servicios del local actualizados.');
    }
}
