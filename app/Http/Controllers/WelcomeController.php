<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\PaginatesPublicRestaurants;
use App\Services\RestaurantExploreService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Laravel\Fortify\Features;

class WelcomeController extends Controller
{
    use PaginatesPublicRestaurants;

    public function __invoke(Request $request, RestaurantExploreService $explore): mixed
    {
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
            'canRegister' => Features::enabled(Features::registration()) && ! $request->user(),
            'restaurants' => $paginator,
            'cuisineTypes' => $explore->activeCuisines(),
            'districts' => $explore->districtsWithRestaurants(),
            'ambiances' => $explore->activeAmbiances(),
            'priceRanges' => $explore->availablePriceRanges(),
            'filters' => $filters,
        ]);
    }
}
