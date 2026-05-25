<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
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

        $activeRoutes = TouristRoute::query()
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->whereNull('completed_at')
            ->latest('route_date')
            ->latest()
            ->get()
            ->map(fn (TouristRoute $r) => $this->routeListItem($r));

        $historyRoutes = TouristRoute::query()
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->whereNotNull('completed_at')
            ->latest('completed_at')
            ->get()
            ->map(fn (TouristRoute $r) => $this->routeListItem($r));

        $draft = $service->formatRoute($service->draftFor($request->user()));

        return Inertia::render('explore/routes/index', [
            'activeRoutes' => $activeRoutes,
            'historyRoutes' => $historyRoutes,
            'draftRoute' => $draft,
        ]);
    }

    public function show(Request $request, TouristRoute $route, TouristRouteService $service): mixed
    {
        $this->ensureTourist($request);
        abort_unless($route->user_id === $request->user()->id, 403);
        abort_unless($route->status === 'active', 404);

        $pathPoints = count($route->path_coordinates ?? []);
        if ($route->stops_count >= 2 && $pathPoints <= $route->stops_count) {
            $route = $service->refreshMetrics($route);
        }

        return Inertia::render('explore/routes/show', [
            'route' => $service->formatRoute($route),
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
