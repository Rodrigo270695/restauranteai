<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CuisineType;
use App\Models\Restaurant;
use App\Models\User;
use App\Services\RestaurantCuisineService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RestaurantController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('restaurants.view'), 403);

        $search = $request->string('search')->trim()->value();
        $perPage = in_array((int) $request->input('per_page'), [10, 15, 25, 50]) ? (int) $request->input('per_page') : 15;

        $ownerScope = fn ($q) => $q->role('restaurant_owner');

        $items = Restaurant::query()
            ->with(['owner:id,name,email', 'cuisineType:id,name', 'cuisineTypes:id,name'])
            ->whereHas('owner', $ownerScope)
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        $statsBase = Restaurant::query()->whereHas('owner', $ownerScope);

        return Inertia::render('app/admin/restaurants/index', [
            'items' => $items,
            'owners' => User::role('restaurant_owner')->orderBy('name')->get(['id', 'name']),
            'cuisineTypes' => CuisineType::orderBy('name')->get(['id', 'name']),
            'filters' => ['search' => $search],
            'stats' => [
                'total' => (clone $statsBase)->count(),
                'active' => (clone $statsBase)->where('is_active', true)->count(),
                'verified' => (clone $statsBase)->where('is_verified', true)->count(),
            ],
        ]);
    }

    public function store(Request $request, RestaurantCuisineService $cuisineService): RedirectResponse
    {
        abort_unless($request->user()?->can('restaurants.create'), 403);

        $data = $request->validate([
            'owner_id' => ['required', 'exists:users,id'],
            'name' => ['required', 'string', 'max:150'],
            'cuisine_type_ids' => ['nullable', 'array'],
            'cuisine_type_ids.*' => ['integer', 'exists:cuisine_types,id'],
            'primary_cuisine_type_id' => ['nullable', 'integer', 'exists:cuisine_types,id'],
            'price_range' => ['required', 'in:economico,moderado,premium'],
            'is_active' => ['sometimes', 'boolean'],
            'is_verified' => ['sometimes', 'boolean'],
        ]);

        try {
            $cuisineIds = $data['cuisine_type_ids'] ?? [];
            $primaryCuisineId = $data['primary_cuisine_type_id'] ?? null;
            unset($data['cuisine_type_ids'], $data['primary_cuisine_type_id']);

            $restaurant = Restaurant::create($data);
            $cuisineService->sync($restaurant, $cuisineIds, $primaryCuisineId);

            return back()->with('success', 'Restaurante creado.');
        } catch (\Throwable) {
            return back()->with('error', 'No se pudo crear el restaurante.');
        }
    }

    public function update(Request $request, Restaurant $restaurant, RestaurantCuisineService $cuisineService): RedirectResponse
    {
        abort_unless($request->user()?->can('restaurants.edit'), 403);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'cuisine_type_ids' => ['nullable', 'array'],
            'cuisine_type_ids.*' => ['integer', 'exists:cuisine_types,id'],
            'primary_cuisine_type_id' => ['nullable', 'integer', 'exists:cuisine_types,id'],
            'price_range' => ['sometimes', 'in:economico,moderado,premium'],
            'is_active' => ['sometimes', 'boolean'],
            'is_verified' => ['sometimes', 'boolean'],
            'is_featured' => ['sometimes', 'boolean'],
        ]);

        try {
            if (array_key_exists('cuisine_type_ids', $data)) {
                $cuisineService->sync(
                    $restaurant,
                    $data['cuisine_type_ids'] ?? [],
                    $data['primary_cuisine_type_id'] ?? null,
                );
                unset($data['cuisine_type_ids'], $data['primary_cuisine_type_id']);
            }

            $restaurant->update($data);

            return back()->with('success', 'Restaurante actualizado.');
        } catch (\Throwable) {
            return back()->with('error', 'No se pudo actualizar.');
        }
    }

    public function destroy(Restaurant $restaurant): RedirectResponse
    {
        abort_unless(request()->user()?->can('restaurants.delete'), 403);

        try {
            $restaurant->delete();
            return back()->with('success', 'Restaurante eliminado.');
        } catch (\Throwable) {
            return back()->with('error', 'No se pudo eliminar.');
        }
    }
}
