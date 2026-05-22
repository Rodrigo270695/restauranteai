<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        abort_unless($request->user()?->can('dashboard.view'), 403);

        if ($request->user()->hasRole('super_admin')) {
            return $this->superAdminDashboard();
        }

        return Inertia::render('dashboard', [
            'variant' => 'owner',
        ]);
    }

    private function superAdminDashboard(): Response
    {
        $pendingReviews = Review::query()
            ->where('is_visible', true)
            ->whereNull('owner_response')
            ->count();

        return Inertia::render('dashboard', [
            'variant' => 'platform',
            'stats' => [
                'restaurants_total' => Restaurant::count(),
                'restaurants_active' => Restaurant::where('is_active', true)->count(),
                'restaurants_verified' => Restaurant::where('is_verified', true)->count(),
                'owners_total' => User::role('restaurant_owner')->count(),
                'reviews_total' => Review::where('is_visible', true)->count(),
                'reviews_pending' => $pendingReviews,
                'avg_rating' => round((float) Review::where('is_visible', true)->avg('rating'), 2),
            ],
        ]);
    }
}
