<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Concerns\ResolvesScopedRestaurant;
use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use App\Models\SupportLanguage;
use App\Services\RestaurantScopeService;
use App\Support\OwnerPanel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RestaurantLanguagesController extends Controller
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

        abort_unless($request->user()?->can('manage_restaurant_languages'), 403);

        $items = SupportLanguage::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $selectedIds = $restaurant->languages()->pluck('support_languages.id')->all();

        return Inertia::render('app/restaurant-languages', [
            ...OwnerPanel::props($restaurant, $admin),
            'saveUrl' => OwnerPanel::saveUrl($restaurant, $admin, $admin ? '/languages' : '/restaurant-languages'),
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
        abort_unless($request->user()?->can('manage_restaurant_languages'), 403);

        $ids = $request->validate([
            'ids' => ['present', 'array'],
            'ids.*' => ['integer', 'exists:support_languages,id'],
        ])['ids'];

        $validIds = SupportLanguage::query()
            ->where('is_active', true)
            ->whereIn('id', $ids)
            ->pluck('id')
            ->all();

        $restaurant = $this->scopedRestaurant($request, $scope, $restaurant);
        $restaurant->languages()->sync($validIds);

        return back()->with('success', 'Idiomas de atención actualizados.');
    }
}
