<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use App\Models\RestaurantReservation;
use App\Services\RestaurantReservationService;
use App\Services\RestaurantScopeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminReservationController extends Controller
{
    public function index(Request $request, RestaurantScopeService $scope): Response|RedirectResponse
    {
        abort_unless($request->user()?->can('reservations.view'), 403);

        if ($scope->isActing($request)) {
            $actingId = $request->session()->get(RestaurantScopeService::ACTING_SESSION_KEY);

            return redirect()->route('app.admin.restaurants.manage.reservations', [
                'restaurant' => $actingId,
            ]);
        }

        $status = $request->string('status')->toString();
        $search = $request->string('search')->trim()->value();
        $perPage = in_array((int) $request->input('per_page'), [10, 15, 25]) ? (int) $request->input('per_page') : 15;

        $query = RestaurantReservation::query()
            ->with(['user:id,name,email', 'restaurant:id,name'])
            ->latest('reserved_for');

        if (in_array($status, ['pending', 'confirmed', 'visited', 'cancelled'], true)) {
            $query->where('status', $status);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%"))
                    ->orWhereHas('restaurant', fn ($r) => $r->where('name', 'like', "%{$search}%"));
            });
        }

        $reservations = $query->paginate($perPage)->withQueryString();
        $service = app(RestaurantReservationService::class);
        $reservations->getCollection()->transform(function (RestaurantReservation $r) use ($service) {
            $formatted = $service->formatForOwnerPanel($r);

            return array_merge($formatted, [
                'restaurant_name' => $r->restaurant?->name ?? '—',
            ]);
        });

        return Inertia::render('app/admin/reservations/index', [
            'reservations' => $reservations,
            'stats' => [
                'pending' => RestaurantReservation::query()->where('status', 'pending')->count(),
                'total' => RestaurantReservation::query()->count(),
            ],
            'filters' => [
                'status' => in_array($status, ['pending', 'confirmed', 'visited', 'cancelled'], true) ? $status : 'all',
                'search' => $search,
            ],
        ]);
    }

    public function confirm(
        Request $request,
        RestaurantReservation $reservation,
        RestaurantReservationService $reservations,
    ): RedirectResponse {
        abort_unless($request->user()?->can('reservations.manage'), 403);

        $restaurant = Restaurant::query()->findOrFail($reservation->restaurant_id);
        $reservations->confirmByRestaurant($restaurant, $reservation);

        return back()->with('success', 'Reserva confirmada.');
    }

    public function reject(
        Request $request,
        RestaurantReservation $reservation,
        RestaurantReservationService $reservations,
    ): RedirectResponse {
        abort_unless($request->user()?->can('reservations.manage'), 403);

        $restaurant = Restaurant::query()->findOrFail($reservation->restaurant_id);
        $reservations->rejectByRestaurant($restaurant, $reservation);

        return back()->with('success', 'Reserva rechazada.');
    }
}
