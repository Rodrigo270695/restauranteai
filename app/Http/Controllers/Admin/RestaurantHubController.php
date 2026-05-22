<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use App\Services\RestaurantScopeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RestaurantHubController extends Controller
{
    public function show(Request $request, Restaurant $restaurant, RestaurantScopeService $scope): Response
    {
        abort_unless($scope->canManageAsAdmin($request->user(), $restaurant), 403);

        $restaurant->load(['owner:id,name,email', 'cuisineType:id,name', 'cuisineTypes:id,name', 'district:id,name']);

        return Inertia::render('app/admin/restaurant-hub', [
            'restaurant' => [
                'id' => $restaurant->id,
                'name' => $restaurant->name,
                'slug' => $restaurant->slug,
                'is_active' => (bool) $restaurant->is_active,
                'is_verified' => (bool) $restaurant->is_verified,
                'avg_rating' => round((float) $restaurant->avg_rating, 2),
                'total_reviews' => (int) $restaurant->total_reviews,
                'total_views' => (int) $restaurant->total_views,
                'owner' => $restaurant->owner ? [
                    'id' => $restaurant->owner->id,
                    'name' => $restaurant->owner->name,
                    'email' => $restaurant->owner->email,
                ] : null,
                'cuisine' => $restaurant->cuisineType?->name,
                'cuisines' => $restaurant->cuisineTypes->map(fn ($c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'is_primary' => (bool) $c->pivot->is_primary,
                ])->values()->all(),
                'district' => $restaurant->district?->name,
            ],
            'counts' => [
                'dishes' => $restaurant->dishes()->count(),
                'promotions' => $restaurant->promotions()->count(),
                'images' => $restaurant->images()->count(),
                'reviews' => $restaurant->reviews()->where('is_visible', true)->count(),
            ],
            'baseUrl' => "/app/admin/restaurants/{$restaurant->id}",
        ]);
    }

    public function impersonate(
        Request $request,
        Restaurant $restaurant,
        RestaurantScopeService $scope,
    ): RedirectResponse {
        $scope->startActing($request, $restaurant);

        return redirect()
            ->route('app.restaurants')
            ->with('success', "Viendo el panel como: {$restaurant->name}");
    }

    public function stopImpersonating(Request $request, RestaurantScopeService $scope): RedirectResponse
    {
        $scope->stopActing($request);

        return redirect()
            ->route('app.admin.restaurants')
            ->with('success', 'Saliste del modo suplantación.');
    }
}
