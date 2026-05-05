<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class TouristProfileController extends Controller
{
    /** Muestra el formulario de configuración del perfil */
    public function show(Request $request): mixed
    {
        $user = $request->user();

        // Solo turistas pueden acceder a esta página
        if (! $user->hasRole('tourist')) {
            return Redirect::route('dashboard');
        }

        // Si ya completó su perfil, va directo al welcome
        $profile = $user->touristProfile;
        if ($profile?->isCompleted()) {
            return Redirect::route('home');
        }

        return Inertia::render('tourist/profile-setup', [
            'user' => [
                'name'  => $user->name,
                'email' => $user->email,
            ],
            'profile' => $profile ? [
                'city'               => $profile->city,
                'bio'                => $profile->bio,
                'budget_preference'  => $profile->budget_preference,
                'preferred_cuisines' => $profile->preferred_cuisines ?? [],
            ] : null,
        ]);
    }

    /** Guarda el perfil y redirige al portal del turista */
    public function store(Request $request): mixed
    {
        $user = $request->user();

        if (! $user->hasRole('tourist')) {
            return Redirect::route('dashboard');
        }

        // El usuario decidió saltar el setup — marca como completado igualmente
        if ($request->boolean('skip')) {
            $user->touristProfile()->firstOrCreate(
                ['user_id' => $user->id],
                ['completed_at' => now()]
            );

            if (! $user->touristProfile->completed_at) {
                $user->touristProfile()->update(['completed_at' => now()]);
            }

            return Redirect::route('explore.index');
        }

        $data = $request->validate([
            'city'               => ['nullable', 'string', 'max:100'],
            'bio'                => ['nullable', 'string', 'max:500'],
            'budget_preference'  => ['nullable', 'in:low,medium,high'],
            'preferred_cuisines' => ['nullable', 'array'],
            'preferred_cuisines.*' => ['string', 'max:50'],
        ]);

        $user->touristProfile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                ...$data,
                'completed_at' => now(),
            ]
        );

        return Redirect::route('explore.index');
    }
}
