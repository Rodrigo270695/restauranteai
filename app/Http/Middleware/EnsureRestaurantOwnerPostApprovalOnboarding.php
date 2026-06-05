<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Dueño aprobado: hasta completar el primer local solo puede usar configuración y datos del local.
 */
class EnsureRestaurantOwnerPostApprovalOnboarding
{
    private const ALLOWED_ROUTE_NAMES = [
        'profile.edit',
        'profile.update',
        'profile.restaurant.update',
        'app.restaurants',
        'app.restaurants.update',
        'app.restaurants.locations.store',
        'app.restaurants.switch',
        'app.restaurants.geocode',
        'logout',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole('restaurant_owner')) {
            return $next($request);
        }

        $profile = $user->restaurantProfile;

        if (! $profile || ! $profile->isApproved() || ! $profile->needsPostApprovalOnboarding()) {
            return $next($request);
        }

        $name = $request->route()?->getName();

        if ($name !== null && in_array($name, self::ALLOWED_ROUTE_NAMES, true)) {
            return $next($request);
        }

        return redirect()->route('app.restaurants');
    }
}
