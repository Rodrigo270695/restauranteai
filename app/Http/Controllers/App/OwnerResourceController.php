<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\DishCategory;
use App\Services\OwnerRestaurantService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OwnerResourceController extends Controller
{
    public function index(Request $request, string $resource, OwnerRestaurantService $ownerRestaurant): Response
    {
        $config = $this->config($resource);
        abort_unless($request->user()?->can($config['permission']), 403);

        $restaurant = $ownerRestaurant->resolve($request->user());
        $model = $config['model'];
        $search = $request->string('search')->trim()->value();
        $perPage = in_array((int) $request->input('per_page'), [10, 15, 25, 50]) ? (int) $request->input('per_page') : 15;

        $query = $model::query()->where('restaurant_id', $restaurant->id);
        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $items = $query->latest()->paginate($perPage)->withQueryString();

        return Inertia::render($config['page'], [
            'resourceKey' => $resource,
            'title' => $config['title'],
            'resourceLabel' => $config['label'],
            'fields' => $config['fields'],
            'readonly' => $config['readonly'] ?? false,
            'items' => $items,
            'options' => $this->options($resource),
            'filters' => ['search' => $search],
        ]);
    }

    public function store(Request $request, string $resource, OwnerRestaurantService $ownerRestaurant): RedirectResponse
    {
        $config = $this->config($resource);
        abort_unless($request->user()?->can($config['permission']), 403);
        abort_if($config['readonly'] ?? false, 403);

        $restaurant = $ownerRestaurant->resolve($request->user());
        $data = $this->validateResource($request, $resource);
        $data['restaurant_id'] = $restaurant->id;

        try {
            $config['model']::create($data);
            return back()->with('success', 'Registro creado.');
        } catch (\Throwable) {
            return back()->with('error', 'No se pudo crear el registro.');
        }
    }

    public function update(Request $request, string $resource, string|int $item, OwnerRestaurantService $ownerRestaurant): RedirectResponse
    {
        $config = $this->config($resource);
        abort_unless($request->user()?->can($config['permission']), 403);
        abort_if($config['readonly'] ?? false, 403);

        $record = $this->findOwned($request, $resource, $item, $ownerRestaurant);
        try {
            $record->update($this->validateResource($request, $resource));
            return back()->with('success', 'Registro actualizado.');
        } catch (\Throwable) {
            return back()->with('error', 'No se pudo actualizar.');
        }
    }

    public function destroy(Request $request, string $resource, string|int $item, OwnerRestaurantService $ownerRestaurant): RedirectResponse
    {
        $config = $this->config($resource);
        abort_unless($request->user()?->can($config['permission']), 403);
        abort_if($config['readonly'] ?? false, 403);

        try {
            $this->findOwned($request, $resource, $item, $ownerRestaurant)->delete();
            return back()->with('success', 'Registro eliminado.');
        } catch (\Throwable) {
            return back()->with('error', 'No se pudo eliminar.');
        }
    }

    /** @return array<string, mixed> */
    private function config(string $resource): array
    {
        $config = config("owner_resources.{$resource}");
        abort_unless($config, 404);

        return $config;
    }

    private function findOwned(Request $request, string $resource, string|int $id, OwnerRestaurantService $ownerRestaurant): Model
    {
        $restaurant = $ownerRestaurant->resolve($request->user());

        return $this->config($resource)['model']::where('restaurant_id', $restaurant->id)->findOrFail($id);
    }

    /** @return array<string, mixed> */
    private function validateResource(Request $request, string $resource): array
    {
        return match ($resource) {
            'dishes' => $request->validate([
                'name' => ['required', 'string', 'max:120'],
                'dish_category_id' => ['nullable', 'exists:dish_categories,id'],
                'description' => ['nullable', 'string'],
                'price' => ['required', 'numeric', 'min:0'],
                'is_available' => ['sometimes', 'boolean'],
                'is_signature' => ['sometimes', 'boolean'],
            ]),
            default => [],
        };
    }

    /** @return array<string, mixed> */
    private function options(string $resource): array
    {
        if ($resource === 'dishes') {
            return ['dish_categories' => DishCategory::where('is_active', true)->orderBy('name')->get(['id', 'name'])];
        }

        return [];
    }
}
