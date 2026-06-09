<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use App\Models\RestaurantReservation;
use App\Models\TouristRoute;
use App\Services\RestaurantReservationService;
use App\Support\PeruDateTime;
use App\Support\RestaurantHoursPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ExploreReservationController extends Controller
{
    public function store(
        Request $request,
        TouristRoute $route,
        Restaurant $restaurant,
        RestaurantReservationService $reservations,
    ): RedirectResponse {
        $this->ensureTourist($request);

        $data = $request->validate([
            'reserved_for' => ['required', 'string', 'max:32'],
            'party_size' => ['required', 'integer', 'min:1', 'max:20'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $when = PeruDateTime::fromLocalInput($data['reserved_for']);

        if ($when->lte(now(RestaurantHoursPresenter::TZ))) {
            throw ValidationException::withMessages([
                'reserved_for' => 'Elige una fecha y hora futura.',
            ]);
        }

        $reservations->createForRouteStop(
            $request->user(),
            $route,
            $restaurant,
            $when,
            (int) $data['party_size'],
            $data['note'] ?? null,
        );

        return back()->with('success', 'Reserva enviada. El local la confirmará pronto.');
    }

    public function confirm(
        Request $request,
        RestaurantReservation $reservation,
        RestaurantReservationService $reservations,
    ): RedirectResponse {
        $this->ensureTourist($request);
        $reservations->confirm($request->user(), $reservation);

        return back()->with('success', 'Reserva confirmada. ¡Buen provecho!');
    }

    public function markVisited(
        Request $request,
        RestaurantReservation $reservation,
        RestaurantReservationService $reservations,
    ): RedirectResponse {
        $this->ensureTourist($request);
        $reservations->markVisited($request->user(), $reservation);

        return back()->with('success', 'Visita registrada. Ya puedes dejar tu reseña.');
    }

    public function cancel(
        Request $request,
        RestaurantReservation $reservation,
        RestaurantReservationService $reservations,
    ): RedirectResponse {
        $this->ensureTourist($request);
        $reservations->cancel($request->user(), $reservation);

        return back()->with('success', 'Reserva cancelada.');
    }

    private function ensureTourist(Request $request): void
    {
        abort_unless($request->user()?->hasRole('tourist'), 403);
    }
}
