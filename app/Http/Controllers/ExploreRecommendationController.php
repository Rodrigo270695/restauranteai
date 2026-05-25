<?php

namespace App\Http\Controllers;

use App\Services\RecommendationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;

class ExploreRecommendationController extends Controller
{
    public function __invoke(Request $request, RecommendationService $recommendations): mixed
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole('tourist')) {
            abort(403);
        }

        $context = array_filter([
            'latitude' => $request->has('lat') ? $request->float('lat') : null,
            'longitude' => $request->has('lng') ? $request->float('lng') : null,
        ], fn ($v) => $v !== null);

        $result = $recommendations->forUser($user, $context, fresh: true);

        if ($request->wantsJson()) {
            return response()->json($result);
        }

        return Redirect::route('explore.index')->with('recommendations_refreshed', true);
    }
}
