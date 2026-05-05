<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class ExploreController extends Controller
{
    /** Portal principal del turista */
    public function index(Request $request): mixed
    {
        $user = $request->user();

        if (! $user->hasRole('tourist')) {
            return Redirect::route('dashboard');
        }

        $profile = $user->touristProfile;

        return Inertia::render('explore/index', [
            'profile' => $profile ? [
                'city'               => $profile->city,
                'bio'                => $profile->bio,
                'preferred_cuisines' => $profile->preferred_cuisines ?? [],
                'budget_preference'  => $profile->budget_preference,
                'completed'          => $profile->isCompleted(),
            ] : null,
        ]);
    }

    /** Vista de edición del perfil turista */
    public function profile(Request $request): mixed
    {
        $user = $request->user();

        if (! $user->hasRole('tourist')) {
            return Redirect::route('dashboard');
        }

        $profile = $user->touristProfile;

        return Inertia::render('explore/profile', [
            'profile' => $profile ? [
                'city'               => $profile->city,
                'bio'                => $profile->bio,
                'preferred_cuisines' => $profile->preferred_cuisines ?? [],
                'budget_preference'  => $profile->budget_preference,
            ] : null,
        ]);
    }

    /** Actualiza el perfil del turista */
    public function updateProfile(Request $request): mixed
    {
        $user = $request->user();

        if (! $user->hasRole('tourist')) {
            return Redirect::route('dashboard');
        }

        $data = $request->validate([
            'city'                 => ['nullable', 'string', 'max:100'],
            'bio'                  => ['nullable', 'string', 'max:500'],
            'budget_preference'    => ['nullable', 'in:low,medium,high'],
            'preferred_cuisines'   => ['nullable', 'array'],
            'preferred_cuisines.*' => ['string', 'max:50'],
        ]);

        $user->touristProfile()->updateOrCreate(
            ['user_id' => $user->id],
            [...$data, 'completed_at' => now()],
        );

        return back()->with('success', true);
    }
}
