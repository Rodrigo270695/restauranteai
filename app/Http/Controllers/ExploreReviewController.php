<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use App\Services\RestaurantReservationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ExploreReviewController extends Controller
{
    public function store(
        Request $request,
        Restaurant $restaurant,
        RestaurantReservationService $reservations,
    ): RedirectResponse {
        $this->ensureTourist($request);
        abort_unless($restaurant->is_active && $restaurant->is_verified, 404);

        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:2000'],
        ]);

        $reservations->submitReview(
            $request->user(),
            $restaurant,
            (int) $data['rating'],
            $data['comment'] ?? null,
        );

        return back()->with('success', '¡Gracias por tu reseña!');
    }

    private function ensureTourist(Request $request): void
    {
        abort_unless($request->user()?->hasRole('tourist'), 403);
    }
}
