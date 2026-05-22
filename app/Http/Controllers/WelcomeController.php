<?php

namespace App\Http\Controllers;

use App\Services\RestaurantExploreService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Laravel\Fortify\Features;

class WelcomeController extends Controller
{
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

        $paginator = $explore->publicQuery($request)
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn ($r) => $explore->formatCard($r));

        $priceRanges = $explore->availablePriceRanges();
        $allowedPrices = collect($priceRanges)->pluck('value')->all();
        $priceRange = $request->string('price_range')->value() ?: null;
        if ($priceRange && ! in_array($priceRange, $allowedPrices, true)) {
            $priceRange = null;
        }

        return Inertia::render('welcome', [
            'canRegister' => Features::enabled(Features::registration()) && ! $request->user(),
            'restaurants' => $paginator,
            'cuisineTypes' => $explore->activeCuisines(),
            'districts' => $explore->districtsWithRestaurants(),
            'priceRanges' => $priceRanges,
            'filters' => [
                'search' => $request->string('search')->value(),
                'cuisine_type_id' => $request->integer('cuisine_type_id') ?: null,
                'price_range' => $priceRange,
                'district_id' => $request->integer('district_id') ?: null,
                'sort' => $sort,
            ],
        ]);
    }
}
