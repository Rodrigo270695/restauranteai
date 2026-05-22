<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Http\Requests\App\ReviewResponseRequest;
use App\Models\Review;
use App\Services\RestaurantScopeService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    public function index(Request $request, RestaurantScopeService $scope): Response
    {
        abort_unless($request->user()?->can('reviews.view'), 403);

        $restaurant = $scope->forOwnerPanel($request);

        $search = $request->string('search')->trim()->value();
        $rating = $request->integer('rating');
        $filter = $request->string('filter')->toString(); // all | pending | answered
        $perPage = in_array((int) $request->input('per_page'), [10, 15, 25]) ? (int) $request->input('per_page') : 10;

        $query = Review::query()
            ->with('user:id,name')
            ->where('restaurant_id', $restaurant->id)
            ->where('is_visible', true);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('comment', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%"));
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

        $reviews = $query->latest()->paginate($perPage)->withQueryString();
        $reviews->getCollection()->transform(fn (Review $r) => $this->formatReview($r));

        $allReviews = Review::query()
            ->where('restaurant_id', $restaurant->id)
            ->where('is_visible', true);

        $total = (clone $allReviews)->count();
        $pending = (clone $allReviews)->whereNull('owner_response')->count();
        $avgRating = round((float) (clone $allReviews)->avg('rating'), 2);

        $distribution = collect(range(1, 5))->mapWithKeys(function (int $star) use ($restaurant) {
            $count = Review::query()
                ->where('restaurant_id', $restaurant->id)
                ->where('is_visible', true)
                ->where('rating', $star)
                ->count();

            return [$star => $count];
        });

        return Inertia::render('app/reviews', [
            'restaurant' => ['id' => $restaurant->id, 'name' => $restaurant->name],
            'owner' => $scope->ownerContext($restaurant),
            'reviews' => $reviews,
            'stats' => [
                'total' => $total,
                'pending' => $pending,
                'answered' => $total - $pending,
                'avg_rating' => $avgRating,
            ],
            'distribution' => $distribution->all(),
            'filters' => [
                'search' => $search,
                'rating' => $rating >= 1 && $rating <= 5 ? $rating : null,
                'filter' => in_array($filter, ['pending', 'answered'], true) ? $filter : 'all',
            ],
        ]);
    }

    public function respond(
        ReviewResponseRequest $request,
        Review $review,
        RestaurantScopeService $scope,
    ): RedirectResponse {
        $restaurant = $scope->forOwnerPanel($request);
        abort_unless($review->restaurant_id === $restaurant->id, 403);

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
            'created_at' => $review->created_at?->translatedFormat('d M Y, H:i'),
            'owner_response' => $review->owner_response,
            'owner_responded_at' => $review->owner_responded_at?->translatedFormat('d M Y, H:i'),
            'has_response' => filled($review->owner_response),
        ];
    }
}
