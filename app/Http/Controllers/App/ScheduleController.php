<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Concerns\ResolvesScopedRestaurant;
use App\Http\Controllers\Controller;
use App\Http\Requests\App\SyncSchedulesRequest;
use App\Models\Restaurant;
use App\Services\RestaurantScopeService;
use App\Support\OwnerPanel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    use ResolvesScopedRestaurant;

    private const DAYS = [0, 1, 2, 3, 4, 5, 6];

    public function index(Request $request, RestaurantScopeService $scope): Response
    {
        return $this->indexForRestaurant($request, $scope->forOwnerPanel($request), false);
    }

    public function indexForRestaurant(Request $request, Restaurant $restaurant, bool $admin = true): Response
    {
        if ($admin) {
            abort_unless(app(RestaurantScopeService::class)->canManageAsAdmin($request->user(), $restaurant), 403);
        }

        abort_unless($request->user()?->can('manage_schedules'), 403);

        $byDay = $restaurant->schedules()->get()->keyBy('day_of_week');

        $week = collect(self::DAYS)->map(function (int $dow) use ($byDay) {
            $row = $byDay->get($dow);

            return [
                'id' => $row?->id,
                'day_of_week' => $dow,
                'opens_at' => $row?->opens_at ? substr((string) $row->opens_at, 0, 5) : null,
                'closes_at' => $row?->closes_at ? substr((string) $row->closes_at, 0, 5) : null,
                'is_closed' => $row ? (bool) $row->is_closed : true,
            ];
        })->values();

        $openDays = $week->where('is_closed', false)->count();

        return Inertia::render('app/schedules', [
            ...OwnerPanel::props($restaurant, $admin),
            'week' => $week,
            'stats' => [
                'open_days' => $openDays,
                'closed_days' => 7 - $openDays,
            ],
        ]);
    }

    public function sync(SyncSchedulesRequest $request, RestaurantScopeService $scope, ?Restaurant $restaurant = null): RedirectResponse
    {
        $restaurant = $this->scopedRestaurant($request, $scope, $restaurant);

        foreach ($request->validated('schedules') as $row) {
            $restaurant->schedules()->updateOrCreate(
                ['day_of_week' => $row['day_of_week']],
                [
                    'is_closed' => $row['is_closed'],
                    'opens_at' => $row['is_closed'] ? null : $row['opens_at'],
                    'closes_at' => $row['is_closed'] ? null : $row['closes_at'],
                ],
            );
        }

        return back()->with('success', 'Horarios de la semana guardados correctamente.');
    }
}
