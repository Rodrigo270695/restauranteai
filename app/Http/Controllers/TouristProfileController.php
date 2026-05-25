<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\LoadsTouristProfileCatalogs;
use App\Http\Requests\TouristProfileSetupRequest;
use App\Services\UserPreferenceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class TouristProfileController extends Controller
{
    use LoadsTouristProfileCatalogs;

    public function __construct(
        private UserPreferenceService $preferences,
    ) {}

    /** Muestra el formulario de configuración del perfil */
    public function show(Request $request): mixed
    {
        $user = $request->user();

        if (! $user->hasRole('tourist')) {
            return Redirect::route('dashboard');
        }

        $profile = $user->touristProfile;
        if ($profile?->isCompleted()) {
            return Redirect::route('explore.discover');
        }

        return Inertia::render('tourist/profile-setup', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'profile' => $profile ? [
                'city' => $profile->city,
                'bio' => $profile->bio,
                'budget_preference' => $profile->budget_preference,
                'preferred_cuisines' => $this->normalizePreferredCuisineSlugs($profile->preferred_cuisines ?? []),
            ] : null,
            'cuisineTypes' => $this->activeCuisineTypes(),
            'districts' => $this->lambayequeDistricts(),
            'budgetOptions' => $this->budgetOptions(),
        ]);
    }

    /** Guarda el perfil o marca como completado si el usuario salta el paso */
    public function store(TouristProfileSetupRequest $request): mixed
    {
        $user = $request->user();

        if ($request->boolean('skip')) {
            $profile = $user->touristProfile()->firstOrCreate(
                ['user_id' => $user->id],
                ['completed_at' => now()],
            );

            if (! $profile->completed_at) {
                $profile->update(['completed_at' => now()]);
            }

            return Redirect::route('explore.discover');
        }

        $data = $request->validated();

        $profile = $user->touristProfile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                ...$data,
                'completed_at' => now(),
            ]
        );

        $this->preferences->syncFromTouristProfile($user, $profile);

        return Redirect::route('explore.discover');
    }
}
