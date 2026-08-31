<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use App\Models\UserInteraction;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TopRestaurantInteractionsController extends Controller
{
    public function __invoke(): Response
    {
        $counts = UserInteraction::query()
            ->whereNotNull('restaurant_id')
            ->select('restaurant_id', DB::raw('count(*) as interactions'))
            ->groupBy('restaurant_id')
            ->orderByDesc('interactions')
            ->limit(15)
            ->get();

        $names = Restaurant::query()
            ->whereIn('id', $counts->pluck('restaurant_id'))
            ->pluck('name', 'id');

        $ranking = $counts->map(fn ($row) => [
            'name' => $names[$row->restaurant_id] ?? 'Restaurante eliminado',
            'interactions' => (int) $row->interactions,
        ])->values();

        return Inertia::render('public/top-interactions', [
            'leader' => $ranking->first(),
            'ranking' => $ranking->all(),
        ]);
    }
}
