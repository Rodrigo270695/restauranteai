<?php

namespace App\Http\Middleware;

use App\Services\RestaurantScopeService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Rutas /app/* del panel del dueño: solo restaurant_owner o super_admin en modo suplantación.
 */
class EnsureRestaurantOwnerContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->hasRole('super_admin') && ! $user->hasRole('restaurant_owner')) {
            if (! $request->session()->has(RestaurantScopeService::ACTING_SESSION_KEY)) {
                return redirect()
                    ->route('dashboard')
                    ->with('error', 'Como administrador, gestiona cada local desde Administración → Restaurantes.');
            }
        }

        return $next($request);
    }
}
