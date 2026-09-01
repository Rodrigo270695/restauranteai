<?php

namespace App\Http\Controllers;

use App\Services\RouteRecommendationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;

class ExploreRouteRecommendationController extends Controller
{
    public function __invoke(Request $request, RouteRecommendationService $routeAi): mixed
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole('tourist')) {
            abort(403);
        }

        $context = array_filter([
            'latitude' => $request->has('lat') ? $request->float('lat') : null,
            'longitude' => $request->has('lng') ? $request->float('lng') : null,
        ], fn ($v) => $v !== null);

        $result = $routeAi->buildDraftFromRecommendations($user, $context);

        if ($request->wantsJson()) {
            return response()->json($result);
        }

        return Redirect::route('explore.routes.index');
    }
}
