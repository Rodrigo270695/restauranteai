<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\App\ReviewResponseRequest;
use App\Models\Restaurant;
use App\Models\Review;
use App\Services\RestaurantScopeService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminReviewController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->hasRole('super_admin'), 403);

        $search = $request->string('search')->trim()->value();
        $rating = $request->integer('rating');
        $filter = $request->string('filter')->toString();
        $restaurantId = $request->integer('restaurant_id');
        $perPage = in_array((int) $request->input('per_page'), [10, 15, 25, 50]) ? (int) $request->input('per_page') : 15;

        $query = Review::query()
            ->with(['user:id,name', 'restaurant:id,name'])
            ->where('is_visible', true);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('comment', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('restaurant', fn ($r) => $r->where('name', 'like', "%{$search}%"));
            });
        }

        if ($rating >= 1 && $rating <= 5) {
            $query->where('rating', $rating);
        }

        if ($filter === 'pending') {
            $query->whereNull('owner_response');
        } elseif ($filter === 'answered') {
            $query->whereNotNull('owner_response');
        }

        if ($restaurantId > 0) {
            $query->where('restaurant_id', $restaurantId);
        }

        $reviews = $query->latest()->paginate($perPage)->withQueryString();
        $reviews->getCollection()->transform(fn (Review $r) => $this->formatReview($r));

        $base = Review::query()->where('is_visible', true);

        return Inertia::render('app/admin/reviews', [
            'reviews' => $reviews,
            'restaurants' => Restaurant::orderBy('name')->get(['id', 'name']),
            'stats' => [
                'total' => (clone $base)->count(),
                'pending' => (clone $base)->whereNull('owner_response')->count(),
                'avg_rating' => round((float) (clone $base)->avg('rating'), 2),
            ],
            'filters' => [
                'search' => $search,
                'rating' => $rating >= 1 && $rating <= 5 ? $rating : null,
                'filter' => in_array($filter, ['pending', 'answered'], true) ? $filter : 'all',
                'restaurant_id' => $restaurantId > 0 ? $restaurantId : null,
            ],
        ]);
    }

    public function respond(
        ReviewResponseRequest $request,
        Review $review,
        RestaurantScopeService $scope,
    ): RedirectResponse {
        abort_unless($request->user()?->hasRole('super_admin'), 403);
        abort_unless($review->restaurant && $scope->canManageAsAdmin($request->user(), $review->restaurant), 403);

        $review->update([
            'owner_response' => $request->validated('owner_response'),
            'owner_responded_at' => Carbon::now(),
        ]);

        return back()->with('success', 'Respuesta publicada.');
    }

    /** @return array<string, mixed> */
    private function formatReview(Review $review): array
    {
        return [
            'id' => $review->id,
            'rating' => (int) $review->rating,
            'comment' => $review->comment,
            'user_name' => $review->user?->name ?? 'Turista',
            'restaurant_id' => $review->restaurant_id,
            'restaurant_name' => $review->restaurant?->name ?? '—',
            'created_at' => $review->created_at?->translatedFormat('d M Y, H:i'),
            'owner_response' => $review->owner_response,
            'owner_responded_at' => $review->owner_responded_at?->translatedFormat('d M Y, H:i'),
            'has_response' => filled($review->owner_response),
        ];
    }
}
