<?php

namespace App\Http\Middleware;

use App\Services\RestaurantScopeService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * En modo suplantación (super_admin viendo panel del dueño), bloquea POST/PUT/PATCH/DELETE.
 */
class EnsureOwnerPanelCanMutate
{
    public function handle(Request $request, Closure $next): Response
    {
        if (in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return $next($request);
        }

        $scope = app(RestaurantScopeService::class);

        if ($scope->isOwnerPanelReadOnly($request)) {
            $message = 'En modo suplantación solo puedes consultar. El dueño del restaurante debe guardar los cambios.';

            if ($request->header('X-Inertia')) {
                return redirect()
                    ->back()
                    ->with('error', $message);
            }

            abort(403, $message);
        }

        return $next($request);
    }
}
