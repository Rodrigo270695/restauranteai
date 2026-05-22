<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\UserInteraction;
use App\Services\RestaurantScopeService;
use App\Support\OwnerPanel;
use App\Models\Restaurant;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    public function index(Request $request, RestaurantScopeService $scope): Response
    {
        return $this->indexForRestaurant($request, $scope->forOwnerPanel($request), false);
    }

    public function indexForRestaurant(Request $request, Restaurant $restaurant, bool $admin = true): Response
    {
        $scope = app(RestaurantScopeService::class);
        if ($admin) {
            abort_unless($scope->canManageAsAdmin($request->user(), $restaurant), 403);
        }

        abort_unless($request->user()?->can('view_analytics'), 403);
        $now = Carbon::now();

        $viewsChart = $this->buildViewsChart($restaurant->id, 14);

        $distribution = collect(range(1, 5))->map(function (int $star) use ($restaurant) {
            $count = Review::query()
                ->where('restaurant_id', $restaurant->id)
                ->where('is_visible', true)
                ->where('rating', $star)
                ->count();

            return ['stars' => $star, 'count' => $count];
        });

        $reviewTotal = Review::query()
            ->where('restaurant_id', $restaurant->id)
            ->where('is_visible', true)
            ->count();

        $pendingResponses = Review::query()
            ->where('restaurant_id', $restaurant->id)
            ->where('is_visible', true)
            ->whereNull('owner_response')
            ->count();

        $recentReviews = Review::query()
            ->with('user:id,name')
            ->where('restaurant_id', $restaurant->id)
            ->where('is_visible', true)
            ->latest()
            ->limit(4)
            ->get()
            ->map(fn (Review $r) => [
                'id' => $r->id,
                'rating' => (int) $r->rating,
                'comment' => $r->comment,
                'user_name' => $r->user?->name ?? 'Turista',
                'created_at' => $r->created_at?->translatedFormat('d M Y'),
                'has_response' => filled($r->owner_response),
            ]);

        $promotionsActive = $restaurant->promotions()
            ->where('is_active', true)
            ->where('starts_at', '<=', $now)
            ->where('ends_at', '>=', $now)
            ->count();

        $viewsPeriod = array_sum($viewsChart['values']);

        return Inertia::render('app/analytics', [
            ...OwnerPanel::props($restaurant, $admin),
            'stats' => [
                'total_views' => (int) $restaurant->total_views,
                'views_last_days' => $viewsPeriod,
                'total_reviews' => $reviewTotal,
                'avg_rating' => round((float) $restaurant->avg_rating, 2),
                'pending_responses' => $pendingResponses,
                'dishes_count' => $restaurant->dishes()->count(),
                'promotions_active' => $promotionsActive,
                'gallery_count' => $restaurant->images()->count(),
                'services_count' => $restaurant->services()->count(),
                'languages_count' => $restaurant->languages()->count(),
            ],
            'views_chart' => $viewsChart,
            'rating_distribution' => $distribution,
            'recent_reviews' => $recentReviews,
        ]);
    }

    /** @return array{labels: string[], values: int[]} */
    private function buildViewsChart(int $restaurantId, int $days): array
    {
        $labels = [];
        $values = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $labels[] = $date->translatedFormat('d M');
            $values[] = UserInteraction::query()
                ->where('restaurant_id', $restaurantId)
                ->where('interaction_type', 'view')
                ->whereDate('created_at', $date)
                ->count();
        }

        return ['labels' => $labels, 'values' => $values];
    }
}
