<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Restaurant;
use App\Services\RestaurantExploreService;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

trait PaginatesPublicRestaurants
{
    /**
     * @param  callable(Restaurant): array<string, mixed>  $formatCard
     */
    protected function paginatePublicRestaurants(
        Request $request,
        RestaurantExploreService $explore,
        int $perPage,
        callable $formatCard,
        ?float $userLat = null,
        ?float $userLng = null,
    ): LengthAwarePaginator {
        $page = max(1, $request->integer('page', 1));

        if ($request->boolean('open_now')) {
            $collection = $explore->publicQuery($request)
                ->get()
                ->filter(fn (Restaurant $r) => $explore->isRestaurantOpen($r))
                ->values();

            return new LengthAwarePaginator(
                $collection
                    ->slice(($page - 1) * $perPage, $perPage)
                    ->map(fn (Restaurant $r) => $formatCard($r))
                    ->values(),
                $collection->count(),
                $perPage,
                $page,
                ['path' => $request->url(), 'query' => $request->query()],
            );
        }

        return $explore->publicQuery($request)
            ->paginate($perPage, ['*'], 'page', $page)
            ->withQueryString()
            ->through(fn (Restaurant $r) => $formatCard($r));
    }

    /**
     * @param  Collection<int, Restaurant>  $sorted
     * @param  callable(Restaurant): array<string, mixed>  $formatCard
     */
    protected function paginateSortedRestaurants(
        Request $request,
        Collection $sorted,
        int $perPage,
        callable $formatCard,
    ): LengthAwarePaginator {
        $page = max(1, $request->integer('page', 1));
        $total = $sorted->count();

        return new LengthAwarePaginator(
            $sorted
                ->slice(($page - 1) * $perPage, $perPage)
                ->map(fn (Restaurant $r) => $formatCard($r))
                ->values(),
            $total,
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()],
        );
    }
}
