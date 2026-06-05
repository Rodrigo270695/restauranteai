<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use App\Models\RestaurantReservation;
use App\Services\RestaurantReservationService;
use App\Services\RestaurantScopeService;
use App\Support\OwnerPanel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReservationController extends Controller
{
    public function index(Request $request, RestaurantScopeService $scope): Response
    {
        return $this->indexForRestaurant($request, $scope->forOwnerPanel($request), false);
    }

    public function indexForRestaurant(Request $request, Restaurant $restaurant, bool $admin = true): Response
    {
        if ($admin) {
            abort_unless(app(RestaurantScopeService::class)->canManageAsAdmin($request->user(), $restaurant), 403);
        }

        abort_unless($request->user()?->can('reservations.view'), 403);

        $status = $request->string('status')->toString();
        $perPage = in_array((int) $request->input('per_page'), [10, 15, 25]) ? (int) $request->input('per_page') : 10;

        $query = RestaurantReservation::query()
            ->with('user:id,name,email')
            ->where('restaurant_id', $restaurant->id)
            ->latest('reserved_for');

        if (in_array($status, ['pending', 'confirmed', 'visited', 'cancelled'], true)) {
            $query->where('status', $status);
        }

        $reservations = $query->paginate($perPage)->withQueryString();
        $reservations->getCollection()->transform(
            fn (RestaurantReservation $r) => app(RestaurantReservationService::class)->formatForOwnerPanel($r),
        );

        $base = RestaurantReservation::query()->where('restaurant_id', $restaurant->id);

        return Inertia::render('app/reservations/index', [
            ...OwnerPanel::props($restaurant, $admin),
            'reservations' => $reservations,
            'stats' => [
                'pending' => (clone $base)->where('status', 'pending')->count(),
                'confirmed' => (clone $base)->where('status', 'confirmed')->count(),
                'visited' => (clone $base)->where('status', 'visited')->count(),
                'total' => (clone $base)->count(),
            ],
            'filters' => [
                'status' => in_array($status, ['pending', 'confirmed', 'visited', 'cancelled'], true) ? $status : 'all',
            ],
        ]);
    }

    public function confirm(
        Request $request,
        RestaurantReservation $reservation,
        RestaurantScopeService $scope,
        RestaurantReservationService $reservations,
    ): RedirectResponse {
        abort_unless($request->user()?->can('reservations.manage'), 403);

        $restaurant = $scope->forOwnerPanel($request);
        $reservations->confirmByRestaurant($restaurant, $reservation);

        return back()->with('success', 'Reserva confirmada. El turista podrá marcar su visita.');
    }

    public function reject(
        Request $request,
        RestaurantReservation $reservation,
        RestaurantScopeService $scope,
        RestaurantReservationService $reservations,
    ): RedirectResponse {
        abort_unless($request->user()?->can('reservations.manage'), 403);

        $restaurant = $scope->forOwnerPanel($request);
        $reservations->rejectByRestaurant($restaurant, $reservation);

        return back()->with('success', 'Reserva rechazada.');
    }

    public function confirmForRestaurant(
        Request $request,
        Restaurant $restaurant,
        RestaurantReservation $reservation,
        RestaurantReservationService $reservations,
    ): RedirectResponse {
        abort_unless(app(RestaurantScopeService::class)->canManageAsAdmin($request->user(), $restaurant), 403);
        abort_unless($request->user()?->can('reservations.manage'), 403);

        $reservations->confirmByRestaurant($restaurant, $reservation);

        return back()->with('success', 'Reserva confirmada. El turista podrá marcar su visita.');
    }

    public function rejectForRestaurant(
        Request $request,
        Restaurant $restaurant,
        RestaurantReservation $reservation,
        RestaurantReservationService $reservations,
    ): RedirectResponse {
        abort_unless(app(RestaurantScopeService::class)->canManageAsAdmin($request->user(), $restaurant), 403);
        abort_unless($request->user()?->can('reservations.manage'), 403);

        $reservations->rejectByRestaurant($restaurant, $reservation);

        return back()->with('success', 'Reserva rechazada.');
    }
}
