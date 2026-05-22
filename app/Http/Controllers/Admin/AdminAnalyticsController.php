<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use App\Models\Review;
use App\Models\UserInteraction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminAnalyticsController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->hasRole('super_admin'), 403);

        $topRestaurants = Restaurant::query()
            ->with('owner:id,name')
            ->orderByDesc('total_views')
            ->limit(8)
            ->get(['id', 'name', 'total_views', 'total_reviews', 'avg_rating', 'is_active', 'is_verified', 'owner_id'])
            ->map(fn (Restaurant $r) => [
                'id' => $r->id,
                'name' => $r->name,
                'owner_name' => $r->owner?->name,
                'total_views' => (int) $r->total_views,
                'total_reviews' => (int) $r->total_reviews,
                'avg_rating' => round((float) $r->avg_rating, 2),
                'is_active' => (bool) $r->is_active,
                'is_verified' => (bool) $r->is_verified,
            ]);

        $viewsChart = $this->buildViewsChart(14);

        return Inertia::render('app/admin/analytics', [
            'stats' => [
                'restaurants_total' => Restaurant::count(),
                'restaurants_active' => Restaurant::where('is_active', true)->count(),
                'reviews_total' => Review::where('is_visible', true)->count(),
                'views_total' => (int) Restaurant::sum('total_views'),
                'views_last_days' => array_sum($viewsChart['values']),
                'avg_rating' => round((float) Review::where('is_visible', true)->avg('rating'), 2),
            ],
            'views_chart' => $viewsChart,
            'top_restaurants' => $topRestaurants,
        ]);
    }

    /** @return array{labels: string[], values: int[]} */
    private function buildViewsChart(int $days): array
    {
        $labels = [];
        $values = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $labels[] = $date->translatedFormat('d M');
            $values[] = UserInteraction::query()
                ->where('interaction_type', 'view')
                ->whereDate('created_at', $date)
                ->count();
        }

        return ['labels' => $labels, 'values' => $values];
    }
}
