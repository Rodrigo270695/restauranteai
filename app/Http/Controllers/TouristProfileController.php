<?php

namespace App\Http\Controllers;

use App\Http\Requests\TouristProfileSetupRequest;
use App\Models\CuisineType;
use App\Models\District;
use App\Services\UserPreferenceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class TouristProfileController extends Controller
{
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

    /** @return list<array{id: int, name: string, slug: string}> */
    private function activeCuisineTypes(): array
    {
        return CuisineType::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (CuisineType $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
            ])
            ->values()
            ->all();
    }

    /** @return list<array{id: int, name: string, province: string}> */
    private function lambayequeDistricts(): array
    {
        return District::query()
            ->with('province:id,name')
            ->whereHas('province.department', fn ($q) => $q->where('code', '14'))
            ->orderBy('name')
            ->get(['id', 'name', 'province_id'])
            ->map(fn (District $d) => [
                'id' => $d->id,
                'name' => $d->name,
                'province' => $d->province->name,
            ])
            ->values()
            ->all();
    }

    /** @return list<array{key: string, price_range: string}> */
    private function budgetOptions(): array
    {
        return [
            ['key' => 'low', 'price_range' => 'economico'],
            ['key' => 'medium', 'price_range' => 'moderado'],
            ['key' => 'high', 'price_range' => 'premium'],
        ];
    }

    /**
     * Convierte valores legacy (nombre) a slugs del catálogo activo.
     *
     * @param  list<string>  $values
     * @return list<string>
     */
    private function normalizePreferredCuisineSlugs(array $values): array
    {
        if ($values === []) {
            return [];
        }

        $bySlug = CuisineType::query()
            ->where('is_active', true)
            ->whereIn('slug', $values)
            ->pluck('slug')
            ->all();

        $byName = CuisineType::query()
            ->where('is_active', true)
            ->whereIn('name', $values)
            ->pluck('slug')
            ->all();

        return array_values(array_unique([...$bySlug, ...$byName]));
    }
}
