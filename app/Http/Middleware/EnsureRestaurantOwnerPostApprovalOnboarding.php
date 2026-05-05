<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Dueño aprobado: hasta marcar post_approval_completed_at solo puede usar perfil (y cerrar sesión).
 */
class EnsureRestaurantOwnerPostApprovalOnboarding
{
    private const ALLOWED_ROUTE_NAMES = [
        'profile.edit',
        'profile.update',
        'profile.restaurant.update',
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

        return redirect()->route('profile.edit');
    }
}
