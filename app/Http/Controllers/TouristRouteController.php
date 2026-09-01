<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use App\Models\RestaurantReservation;
use App\Models\TouristRoute;
use App\Services\TouristRouteService;
use App\Services\UserInteractionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TouristRouteController extends Controller
{
    public function index(Request $request, TouristRouteService $service): mixed
    {
        $this->ensureTourist($request);
        $userId = $request->user()->id;

        $listQuery = fn () => TouristRoute::query()
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->with(['stops' => fn ($q) => $q->orderBy('position')->with('restaurant:id,name')])
            ->withCount([
                'reservations as visited_count' => fn ($q) => $q->where(
                    'status',
                    RestaurantReservation::STATUS_VISITED,
                ),
            ]);

        $activeRoutes = $listQuery()
            ->whereNull('completed_at')
            ->latest('route_date')
            ->latest()
            ->get()
            ->map(fn (TouristRoute $r) => $this->routeListItem($r));

        $historyRoutes = $listQuery()
            ->whereNotNull('completed_at')
            ->latest('completed_at')
            ->get()
            ->map(fn (TouristRoute $r) => $this->routeListItem($r));

        $draft = $service->formatRoute($service->draftFor($request->user()), $request->user());
        $favoritedIds = array_fill_keys($service->favoritedRouteIds($request->user()), true);

        return Inertia::render('explore/routes/index', [
            'activeRoutes' => $activeRoutes,
            'historyRoutes' => $historyRoutes,
            'draftRoute' => $draft,
            'favoritedRouteIds' => array_keys($favoritedIds),
        ]);
    }

    public function show(Request $request, TouristRoute $route, TouristRouteService $service): mixed
    {
        $this->ensureTourist($request);
        abort_unless($route->user_id === $request->user()->id, 403);
        abort_unless($route->status === 'active', 404);

        return Inertia::render('explore/routes/show', [
            'route' => $service->formatRoute($route, $request->user()),
            'mapCenter' => ['lat' => -6.7766, 'lng' => -79.8442],
        ]);
    }

    public function addStop(
        Request $request,
        Restaurant $restaurant,
        TouristRouteService $service,
        UserInteractionService $interactions,
    ): RedirectResponse {
        $this->ensureTourist($request);
        $user = $request->user();
        $service->addStop($user, $restaurant);
        $interactions->markRecommendationAccepted($user, $restaurant);

        return back()->with('success', 'Lugar agregado a tu ruta.');
    }

    public function removeStop(Request $request, Restaurant $restaurant, TouristRouteService $service): RedirectResponse
    {
        $this->ensureTourist($request);
        $service->removeStop($request->user(), $restaurant);

        return back()->with('success', 'Lugar quitado de tu ruta.');
    }

    public function reorderStops(Request $request, TouristRouteService $service): RedirectResponse
    {
        $this->ensureTourist($request);

        $data = $request->validate([
            'slugs' => ['required', 'array', 'min:1', 'max:8'],
            'slugs.*' => ['required', 'string', 'max:180'],
        ]);

        $service->reorderDraftStops($request->user(), $data['slugs']);

        return back();
    }

    public function publish(Request $request, TouristRouteService $service): RedirectResponse
    {
        $this->ensureTourist($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'route_date' => ['nullable', 'date'],
        ]);

        $route = $service->publish(
            $request->user(),
            $data['name'],
            $data['description'] ?? null,
            $data['route_date'] ?? null,
        );

        return redirect()
            ->route('explore.routes.show', $route)
            ->with('success', 'Ruta guardada para hoy. ¡Buen provecho!');
    }

    public function complete(Request $request, TouristRoute $route, TouristRouteService $service): RedirectResponse
    {
        $this->ensureTourist($request);
        $service->complete($request->user(), $route);

        return redirect()
            ->route('explore.routes.index')
            ->with('success', 'Ruta marcada como completada.');
    }

    public function destroy(Request $request, TouristRoute $route): RedirectResponse
    {
        $this->ensureTourist($request);
        abort_unless($route->user_id === $request->user()->id, 403);

        $route->delete();

        return redirect()->route('explore.routes.index')->with('success', 'Ruta eliminada.');
    }

    /** @return array<string, mixed> */
    private function routeListItem(TouristRoute $r): array
    {
        return [
            'id' => $r->id,
            'name' => $r->name,
            'slug' => $r->slug,
            'stops_count' => $r->stops_count,
            'visited_count' => (int) ($r->visited_count ?? 0),
            'stop_previews' => $r->stops->map(fn ($s) => $s->restaurant->name)->values()->all(),
            'total_distance_km' => $r->total_distance_km !== null ? (float) $r->total_distance_km : null,
            'estimated_minutes' => $r->estimated_minutes,
            'route_date' => $r->route_date?->toDateString(),
            'completed_at' => $r->completed_at?->toIso8601String(),
            'is_completed' => $r->isCompleted(),
        ];
    }

    private function ensureTourist(Request $request): void
    {
        abort_unless($request->user()?->hasRole('tourist'), 403);
    }
}
