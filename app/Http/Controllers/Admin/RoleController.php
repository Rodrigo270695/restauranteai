<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RoleRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    private const PROTECTED_ROLES = ['super_admin', 'restaurant_owner', 'tourist'];

    public function index(Request $request): Response
    {
        $search  = $request->string('search')->trim()->value();
        $perPage = in_array((int) $request->input('per_page'), [10, 15, 25, 50, 100])
            ? (int) $request->input('per_page')
            : 15;

        $sortable = ['name', 'permissions_count', 'users_count', 'created_at'];
        $sortKey  = in_array($request->input('sort'), $sortable) ? $request->input('sort') : 'name';
        $sortDir  = $request->input('dir') === 'desc' ? 'desc' : 'asc';

        $roles = Role::query()
            ->with('permissions:id,name')
            ->withCount('permissions', 'users')
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->orderBy($sortKey, $sortDir)
            ->paginate($perPage)
            ->withQueryString();

        $allPermissions = Permission::orderBy('name')->get(['id', 'name']);

        return Inertia::render('app/admin/roles', [
            'roles' => $roles,
            'allPermissions' => $allPermissions,
            'filters' => ['search' => $search, 'sort' => $sortKey, 'dir' => $sortDir],
            'stats' => [
                'totalRoles'       => Role::count(),
                'totalPermissions' => Permission::count(),
                'currentPage'      => $roles->currentPage(),
                'lastPage'         => $roles->lastPage(),
                'onPage'           => $roles->count(),
                'withoutPermissions' => Role::doesntHave('permissions')->count(),
            ],
        ]);
    }

    public function store(RoleRequest $request): RedirectResponse
    {
        try {
            $role = Role::create(['name' => $request->validated('name'), 'guard_name' => 'web']);

            if ($permissions = $request->validated('permissions')) {
                $role->syncPermissions($permissions);
            }

            return back()->with('success', "Rol «{$role->name}» creado correctamente.");
        } catch (\Throwable $e) {
            return back()->with('error', 'No se pudo crear el rol. Intenta nuevamente.');
        }
    }

    public function update(RoleRequest $request, Role $role): RedirectResponse
    {
        $protected = in_array($role->name, self::PROTECTED_ROLES, true);

        if ($protected && $request->has('name')) {
            return back()->with('error', "El rol «{$role->name}» es del sistema y no puede renombrarse.");
        }

        try {
            if (! $protected && $request->has('name')) {
                $role->update(['name' => $request->validated('name')]);
            }

            if ($request->has('permissions')) {
                $role->syncPermissions($request->validated('permissions', []));
            }

            return back()->with('success', "Rol «{$role->name}» actualizado correctamente.");
        } catch (\Throwable $e) {
            return back()->with('error', 'No se pudo actualizar el rol. Intenta nuevamente.');
        }
    }

    public function destroy(Role $role): RedirectResponse
    {
        if (in_array($role->name, self::PROTECTED_ROLES, true)) {
            return back()->with('error', "El rol «{$role->name}» es del sistema y no puede eliminarse.");
        }

        try {
            $name = $role->name;
            $role->delete();

            return back()->with('success', "Rol «{$name}» eliminado correctamente.");
        } catch (\Throwable $e) {
            return back()->with('error', 'No se pudo eliminar el rol. Intenta nuevamente.');
        }
    }
}
