<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthenticatedHomeController extends Controller
{
    /** Redirige al destino correcto según el rol (evita 403 en /dashboard para turistas). */
    public function __invoke(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('home');
        }

        if ($user->hasRole('tourist')) {
            $done = $user->touristProfile?->isCompleted();

            return redirect()->route($done ? 'home' : 'profile.setup');
        }

        if ($user->hasRole('restaurant_owner')) {
            $profile = $user->restaurantProfile;
            if ($profile?->isRejected()) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('login')->withErrors([
                    'email' => 'Tu solicitud de negocio fue rechazada. No puedes acceder con esta cuenta.',
                ]);
            }
            if (! $profile || ! $profile->isApproved()) {
                return redirect()->route('owner.pending');
            }
            if ($profile->needsPostApprovalOnboarding()) {
                return redirect()->route('profile.edit');
            }

            return redirect()->route('dashboard');
        }

        if ($user->hasRole('super_admin')) {
            return redirect()->route('dashboard');
        }

        return redirect()->route('home');
    }
}
