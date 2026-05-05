<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Los dueños solo acceden al panel admin si su restaurant_profiles.status es "approved".
 */
class EnsureRestaurantOwnerApproved
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->hasRole('restaurant_owner')) {
            $profile = $user->restaurantProfile;

            if (! $profile || ! $profile->isApproved()) {
                return redirect()->route('owner.pending');
            }
        }

        return $next($request);
    }
}
