<?php

namespace App\Http\Controllers;

use App\Http\Requests\Explore\RecordInteractionRequest;
use App\Models\Restaurant;
use App\Services\UserInteractionService;

class ExploreRestaurantInteractionController extends Controller
{
    public function store(
        RecordInteractionRequest $request,
        Restaurant $restaurant,
        UserInteractionService $interactions,
    ): mixed {
        abort_unless($restaurant->is_active && $restaurant->is_verified, 404);

        $type = $request->validated('interaction_type');
        $interactions->record($request->user(), $restaurant, $type);

        $payload = [
            'isFavorited' => $interactions->isFavorited($request->user(), $restaurant),
        ];

        if ($request->wantsJson()) {
            return response()->json($payload);
        }

        return back()->with($payload);
    }
}
