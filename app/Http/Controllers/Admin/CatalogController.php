<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CatalogItemRequest;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    public function index(Request $request, string $catalog): Response
    {
        $config = $this->config($catalog);
        abort_unless($request->user()?->can("{$catalog}.view"), 403);

        $model = $config['model'];
        $search = $request->string('search')->trim()->value();
        $perPage = in_array((int) $request->input('per_page'), [10, 15, 25, 50]) ? (int) $request->input('per_page') : 15;
        $sortKey = in_array($request->input('sort'), ['name', 'created_at', 'is_active']) ? $request->input('sort') : 'name';
        $sortDir = $request->input('dir') === 'desc' ? 'desc' : 'asc';

        $query = $model::query();
        if ($search) {
            $query->where(function ($q) use ($config, $search) {
                foreach ($config['search'] as $col) {
                    $q->orWhere($col, 'like', "%{$search}%");
                }
            });
        }

        $items = $query->orderBy($sortKey, $sortDir)->paginate($perPage)->withQueryString();

        return Inertia::render($config['page'], [
            'catalogKey' => $catalog,
            'title' => $config['title'],
            'resourceLabel' => $config['label'],
            'fields' => $config['fields'],
            'items' => $items,
            'filters' => ['search' => $search, 'sort' => $sortKey, 'dir' => $sortDir],
            'stats' => ['total' => $model::count(), 'active' => $model::where('is_active', true)->count()],
        ]);
    }

    public function store(CatalogItemRequest $request, string $catalog): RedirectResponse
    {
        $config = $this->config($catalog);
        try {
            $config['model']::create($this->payload($request, $config));
            return back()->with('success', ucfirst($config['label']).' creado correctamente.');
        } catch (\Throwable) {
            return back()->with('error', 'No se pudo crear el registro.');
        }
    }

    /** @param  string|int  $item  ID del registro (viene como string desde la ruta). */
    public function update(CatalogItemRequest $request, string|int $item, string $catalog): RedirectResponse
    {
        $config = $this->config($catalog);
        $record = $this->find($catalog, $item);
        try {
            $record->update($this->payload($request, $config));
            return back()->with('success', ucfirst($config['label']).' actualizado correctamente.');
        } catch (\Throwable) {
            return back()->with('error', 'No se pudo actualizar el registro.');
        }
    }

    public function destroy(Request $request, string|int $item, string $catalog): RedirectResponse
    {
        abort_unless($request->user()?->can("{$catalog}.delete"), 403);
        $config = $this->config($catalog);
        try {
            $this->find($catalog, $item)->delete();
            return back()->with('success', ucfirst($config['label']).' eliminado correctamente.');
        } catch (\Throwable) {
            return back()->with('error', 'No se pudo eliminar. Puede tener registros asociados.');
        }
    }

    /** @return array<string, mixed> */
    private function config(string $catalog): array
    {
        $config = config("catalog_resources.{$catalog}");
        abort_unless($config, 404);

        return $config;
    }

    private function find(string $catalog, string|int $id): Model
    {
        $config = $this->config($catalog);

        return $config['model']::findOrFail((int) $id);
    }

    /** @return array<string, mixed> */
    private function payload(CatalogItemRequest $request, array $config): array
    {
        $keys = collect($config['fields'])->pluck('key')->all();
        $data = $request->only($keys);
        if (! isset($data['is_active'])) {
            $data['is_active'] = true;
        }

        return $data;
    }
}
