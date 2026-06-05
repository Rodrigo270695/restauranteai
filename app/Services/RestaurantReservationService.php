<?php

namespace App\Services;

use App\Models\Restaurant;
use App\Models\RestaurantReservation;
use App\Models\Review;
use App\Models\TouristRoute;
use App\Models\TouristRouteStop;
use App\Models\User;
use App\Support\RestaurantHoursPresenter;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RestaurantReservationService
{
    public function __construct(
        private RestaurantHoursPresenter $hours,
    ) {}

    public function createForRouteStop(
        User $user,
        TouristRoute $route,
        Restaurant $restaurant,
        string $reservedFor,
        int $partySize,
        ?string $note = null,
    ): RestaurantReservation {
        abort_unless($route->user_id === $user->id, 403);
        abort_unless($restaurant->is_active && $restaurant->is_verified, 404);

        $when = Carbon::parse($reservedFor, RestaurantHoursPresenter::TZ);
        $this->hours->assertOpenAt($restaurant, $when);

        $stop = $route->stops()->where('restaurant_id', $restaurant->id)->first();
        if (! $stop) {
            throw ValidationException::withMessages([
                'restaurant' => 'Este local no está en tu ruta.',
            ]);
        }

        $existing = $this->activeReservationForStop($user, $stop);
        if ($existing) {
            throw ValidationException::withMessages([
                'reservation' => 'Ya tienes una reserva activa para esta parada.',
            ]);
        }

        return RestaurantReservation::create([
            'user_id' => $user->id,
            'restaurant_id' => $restaurant->id,
            'tourist_route_id' => $route->id,
            'tourist_route_stop_id' => $stop->id,
            'reserved_for' => $when,
            'party_size' => max(1, min($partySize, 20)),
            'status' => RestaurantReservation::STATUS_PENDING,
            'note' => $note,
        ]);
    }

    public function confirm(User $user, RestaurantReservation $reservation): RestaurantReservation
    {
        $this->assertTouristOwner($user, $reservation);
        abort_unless($reservation->isPending(), 422);

        $reservation->update([
            'status' => RestaurantReservation::STATUS_CONFIRMED,
            'confirmed_at' => now(),
        ]);

        return $reservation->fresh();
    }

    public function confirmByRestaurant(Restaurant $restaurant, RestaurantReservation $reservation): RestaurantReservation
    {
        abort_unless($reservation->restaurant_id === $restaurant->id, 403);
        abort_unless($reservation->isPending(), 422);

        $reservation->update([
            'status' => RestaurantReservation::STATUS_CONFIRMED,
            'confirmed_at' => now(),
        ]);

        return $reservation->fresh();
    }

    public function rejectByRestaurant(Restaurant $restaurant, RestaurantReservation $reservation): RestaurantReservation
    {
        abort_unless($reservation->restaurant_id === $restaurant->id, 403);
        abort_unless($reservation->isPending(), 422);

        $reservation->update(['status' => RestaurantReservation::STATUS_CANCELLED]);

        return $reservation->fresh();
    }

    public function markVisited(User $user, RestaurantReservation $reservation): RestaurantReservation
    {
        $this->assertTouristOwner($user, $reservation);
        abort_unless($reservation->isConfirmed(), 422);

        $reservation->update([
            'status' => RestaurantReservation::STATUS_VISITED,
            'visited_at' => now(),
        ]);

        return $reservation->fresh();
    }

    public function cancel(User $user, RestaurantReservation $reservation): RestaurantReservation
    {
        $this->assertTouristOwner($user, $reservation);
        abort_unless(in_array($reservation->status, [
            RestaurantReservation::STATUS_PENDING,
            RestaurantReservation::STATUS_CONFIRMED,
        ], true), 422);

        $reservation->update(['status' => RestaurantReservation::STATUS_CANCELLED]);

        return $reservation->fresh();
    }

    public function userHasReview(User $user, Restaurant $restaurant): bool
    {
        return Review::query()
            ->where('user_id', $user->id)
            ->where('restaurant_id', $restaurant->id)
            ->exists();
    }

    public function canUserReview(User $user, Restaurant $restaurant): bool
    {
        if ($this->userHasReview($user, $restaurant)) {
            return false;
        }

        return RestaurantReservation::query()
            ->where('user_id', $user->id)
            ->where('restaurant_id', $restaurant->id)
            ->where('status', RestaurantReservation::STATUS_VISITED)
            ->exists();
    }

    public function submitReview(User $user, Restaurant $restaurant, int $rating, ?string $comment): Review
    {
        if (! $this->canUserReview($user, $restaurant)) {
            throw ValidationException::withMessages([
                'rating' => 'Solo puedes reseñar después de visitar el local con una reserva confirmada.',
            ]);
        }

        return DB::transaction(function () use ($user, $restaurant, $rating, $comment) {
            $review = Review::create([
                'user_id' => $user->id,
                'restaurant_id' => $restaurant->id,
                'rating' => $rating,
                'comment' => $comment,
                'is_visible' => true,
            ]);

            $stats = Review::query()
                ->where('restaurant_id', $restaurant->id)
                ->where('is_visible', true)
                ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as total')
                ->first();

            $restaurant->update([
                'avg_rating' => round((float) ($stats->avg_rating ?? 0), 2),
                'total_reviews' => (int) ($stats->total ?? 0),
            ]);

            return $review;
        });
    }

    public function reservationForStop(User $user, TouristRouteStop $stop): ?RestaurantReservation
    {
        return RestaurantReservation::query()
            ->where('user_id', $user->id)
            ->where('tourist_route_stop_id', $stop->id)
            ->whereIn('status', [
                RestaurantReservation::STATUS_PENDING,
                RestaurantReservation::STATUS_CONFIRMED,
                RestaurantReservation::STATUS_VISITED,
            ])
            ->latest()
            ->first();
    }

    public function activeReservationForStop(User $user, TouristRouteStop $stop): ?RestaurantReservation
    {
        return RestaurantReservation::query()
            ->where('user_id', $user->id)
            ->where('tourist_route_stop_id', $stop->id)
            ->whereIn('status', [
                RestaurantReservation::STATUS_PENDING,
                RestaurantReservation::STATUS_CONFIRMED,
            ])
            ->latest()
            ->first();
    }

    /** @return array<string, mixed>|null */
    public function formatReservation(?RestaurantReservation $reservation, ?User $user = null): ?array
    {
        if (! $reservation) {
            return null;
        }

        $hasReview = $user
            ? Review::query()
                ->where('user_id', $user->id)
                ->where('restaurant_id', $reservation->restaurant_id)
                ->exists()
            : false;

        return [
            'id' => $reservation->id,
            'status' => $reservation->status,
            'reserved_for' => $reservation->reserved_for->toIso8601String(),
            'party_size' => $reservation->party_size,
            'note' => $reservation->note,
            'confirmed_at' => $reservation->confirmed_at?->toIso8601String(),
            'visited_at' => $reservation->visited_at?->toIso8601String(),
            'can_confirm' => false,
            'awaiting_restaurant' => $reservation->isPending(),
            'can_mark_visited' => $reservation->isConfirmed(),
            'can_review' => $reservation->isVisited() && ! $hasReview,
            'has_review' => $hasReview,
        ];
    }

    /** @return array<string, mixed> */
    public function formatForOwnerPanel(RestaurantReservation $reservation): array
    {
        $reservation->loadMissing('user:id,name,email');

        return [
            'id' => $reservation->id,
            'status' => $reservation->status,
            'reserved_for' => $reservation->reserved_for->translatedFormat('d M Y, H:i'),
            'party_size' => $reservation->party_size,
            'note' => $reservation->note,
            'created_at' => $reservation->created_at?->translatedFormat('d M Y, H:i'),
            'confirmed_at' => $reservation->confirmed_at?->translatedFormat('d M Y, H:i'),
            'visited_at' => $reservation->visited_at?->translatedFormat('d M Y, H:i'),
            'guest_name' => $reservation->user?->name ?? 'Turista',
            'guest_email' => $reservation->user?->email,
            'can_confirm' => $reservation->isPending(),
            'can_reject' => $reservation->isPending(),
        ];
    }

    private function assertTouristOwner(User $user, RestaurantReservation $reservation): void
    {
        abort_unless($reservation->user_id === $user->id, 403);
    }
}
