<?php

namespace App\Http\Middleware;

use App\Services\RestaurantScopeService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user'        => $request->user(),
                'roles'       => $request->user()?->getRoleNames()->toArray() ?? [],
                'permissions' => $request->user()?->getAllPermissions()->pluck('name')->toArray() ?? [],
            ],
            'actingRestaurant' => $this->resolveActingRestaurant($request),
            'ownerPanelReadOnly' => app(RestaurantScopeService::class)->isOwnerPanelReadOnly($request),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => $this->resolveFlash($request),
        ];
    }

    /**
     * Mapea los mensajes de sesión flash al formato { type, message }
     * que consume useFlashToast en el frontend.
     */
    private function resolveFlash(Request $request): array
    {
        $session = $request->session();

        $map = [
            'success' => 'success',
            'error'   => 'error',
            'warning' => 'warning',
            'info'    => 'info',
        ];

        foreach ($map as $key => $type) {
            if ($session->has($key)) {
                return ['type' => $type, 'message' => $session->get($key)];
            }
        }

        // Errores de validación globales (p. ej. delete protegido)
        if ($session->has('errors')) {
            $errors = $session->get('errors');
            $first  = method_exists($errors, 'first') ? $errors->first() : null;
            if ($first) {
                return ['type' => 'error', 'message' => $first];
            }
        }

        return [];
    }

    /** @return array<string, mixed>|null */
    private function resolveActingRestaurant(Request $request): ?array
    {
        $scope = app(RestaurantScopeService::class);
        $restaurant = $scope->actingRestaurant($request);

        if (! $restaurant) {
            return null;
        }

        return [
            'id' => $restaurant->id,
            'name' => $restaurant->name,
        ];
    }
}
