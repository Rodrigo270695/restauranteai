<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ApproveOwnerBusinessRequest;
use App\Http\Requests\Admin\UserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->value();
        $role = $request->string('role')->trim()->value();
        $ownerStatus = $request->string('owner_status')->trim()->value();
        $perPage = in_array((int) $request->input('per_page'), [10, 15, 25, 50, 100], true)
            ? (int) $request->input('per_page')
            : 15;

        $sortable = ['name', 'email', 'roles_count', 'created_at'];
        $sortKey = in_array($request->input('sort'), $sortable, true) ? $request->input('sort') : 'name';
        $sortDir = $request->input('dir') === 'desc' ? 'desc' : 'asc';

        $roleValid = $role !== '' && Role::where('name', $role)->exists();

        $ownerStatusValid = in_array($ownerStatus, ['pending', 'approved', 'rejected'], true);

        $users = User::query()
            ->with([
                'roles:id,name',
                'restaurantProfile',
            ])
            ->withCount('roles')
            ->when($search, function ($q) use ($search) {
                $q->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($roleValid, fn ($q) => $q->whereHas('roles', fn ($r) => $r->where('name', $role)))
            ->when($ownerStatusValid, fn ($q) => $q->whereHas(
                'restaurantProfile',
                fn ($p) => $p->where('status', $ownerStatus)
            ))
            ->orderBy($sortKey, $sortDir)
            ->paginate($perPage)
            ->withQueryString();

        $allRoles = Role::orderBy('name')->get(['id', 'name']);

        return Inertia::render('app/admin/users', [
            'users' => $users,
            'allRoles' => $allRoles,
            'filters' => [
                'search' => $search,
                'sort' => $sortKey,
                'dir' => $sortDir,
                'role' => $roleValid ? $role : '',
                'owner_status' => $ownerStatusValid ? $ownerStatus : '',
            ],
            'stats' => [
                'totalUsers' => User::count(),
                'totalRoles' => Role::count(),
                'currentPage' => $users->currentPage(),
                'lastPage' => $users->lastPage(),
                'onPage' => $users->count(),
                'withoutRoles' => User::doesntHave('roles')->count(),
            ],
        ]);
    }

    public function store(UserRequest $request): RedirectResponse
    {
        try {
            $data = $request->safe()->only(['name', 'email', 'password']);
            $user = User::create($data);

            if ($roles = $request->validated('roles')) {
                $user->syncRoles($roles);
            }

            return back()->with('success', "Usuario «{$user->name}» creado correctamente.");
        } catch (\Throwable $e) {
            return back()->with('error', 'No se pudo crear el usuario. Intenta nuevamente.');
        }
    }

    public function update(UserRequest $request, User $user): RedirectResponse
    {
        $onlyRoles = ! $request->has('name')
            && ! $request->has('email')
            && ! $request->has('password');

        if (! $onlyRoles && $this->isPortalManagedAccount($user)) {
            return back()->with('error', 'No se pueden editar los datos de cuentas con rol dueño de restaurante o turista.');
        }

        if ($request->has('roles') && $this->isPortalManagedAccount($user)) {
            return back()->with('error', 'No se pueden modificar los roles de cuentas con rol dueño de restaurante o turista.');
        }

        if (! $onlyRoles) {
            $data = [];
            if ($request->has('name')) {
                $data['name'] = $request->validated('name');
            }
            if ($request->has('email')) {
                $data['email'] = $request->validated('email');
            }
            if ($request->filled('password')) {
                $data['password'] = $request->validated('password');
            }
            if ($data !== []) {
                $user->update($data);
            }
        }

        if ($request->has('roles')) {
            $roles = $request->validated('roles', []);
            if (! $this->canChangeRolesTo($user, $roles)) {
                return back()->with('error', 'No se puede dejar al sistema sin al menos un super administrador.');
            }
            $user->syncRoles($roles);
        }

        return back()->with('success', "Usuario «{$user->name}» actualizado correctamente.");
    }

    public function destroy(User $user): RedirectResponse
    {
        if (auth()->id() === $user->id) {
            return back()->with('error', 'No puedes eliminar tu propia cuenta.');
        }

        if ($this->isPortalManagedAccount($user)) {
            return back()->with('error', 'No se pueden eliminar cuentas con rol dueño de restaurante o turista.');
        }

        if ($user->hasRole('super_admin') && User::role('super_admin')->count() <= 1) {
            return back()->with('error', 'No se puede eliminar el único super administrador del sistema.');
        }

        try {
            $name = $user->name;
            $user->delete();

            return back()->with('success', "Usuario «{$name}» eliminado correctamente.");
        } catch (\Throwable $e) {
            return back()->with('error', 'No se pudo eliminar el usuario. Intenta nuevamente.');
        }
    }

    private function isPortalManagedAccount(User $user): bool
    {
        return $user->hasAnyRole(['restaurant_owner', 'tourist']);
    }

    /**
     * @param  list<string>  $newRoleNames
     */
    private function canChangeRolesTo(User $user, array $newRoleNames): bool
    {
        if (! $user->hasRole('super_admin')) {
            return true;
        }

        if (in_array('super_admin', $newRoleNames, true)) {
            return true;
        }

        return User::role('super_admin')->where('id', '!=', $user->id)->exists();
    }

    public function approveRestaurant(ApproveOwnerBusinessRequest $request, User $user): RedirectResponse
    {
        if (! $user->hasRole('restaurant_owner')) {
            return back()->with('error', 'Solo se pueden aprobar cuentas con rol de dueño de restaurante.');
        }

        $profile = $user->restaurantProfile;

        if (! $profile) {
            return back()->with('error', 'Este usuario no tiene perfil de negocio registrado.');
        }

        if ($profile->status !== 'pending') {
            return back()->with('error', 'Solo se pueden aprobar solicitudes en estado pendiente.');
        }

        $profile->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
            'rejection_reason' => null,
        ]);

        return back()->with('success', "Negocio «{$profile->business_name}» aprobado. El dueño ya puede acceder al panel.");
    }
}
