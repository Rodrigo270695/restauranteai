<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DepartmentRequest;
use App\Http\Requests\Admin\DistrictRequest;
use App\Http\Requests\Admin\ProvinceRequest;
use App\Models\Department;
use App\Models\District;
use App\Models\Province;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class GeographyController extends Controller
{
    public function index(): Response
    {
        $departments = Department::with(['provinces.districts'])
            ->orderBy('name')
            ->get();

        return Inertia::render('app/admin/geography/index', [
            'departments' => $departments,
            'stats'       => [
                'departments' => Department::count(),
                'provinces'   => Province::count(),
                'districts'   => District::count(),
            ],
        ]);
    }

    // ── Departamentos ──────────────────────────────────────────────────────────

    public function storeDepartment(DepartmentRequest $request): RedirectResponse
    {
        try {
            $dept = Department::create($request->validated());
            return back()->with('success', "Departamento «{$dept->name}» creado.");
        } catch (\Throwable) {
            return back()->with('error', 'No se pudo crear el departamento.');
        }
    }

    public function updateDepartment(DepartmentRequest $request, Department $department): RedirectResponse
    {
        try {
            $department->update($request->validated());
            return back()->with('success', "Departamento «{$department->name}» actualizado.");
        } catch (\Throwable) {
            return back()->with('error', 'No se pudo actualizar el departamento.');
        }
    }

    public function destroyDepartment(Department $department): RedirectResponse
    {
        try {
            $name = $department->name;
            $department->delete();
            return back()->with('success', "Departamento «{$name}» eliminado.");
        } catch (\Throwable) {
            return back()->with('error', 'No se pudo eliminar. Puede tener provincias asociadas.');
        }
    }

    // ── Provincias ─────────────────────────────────────────────────────────────

    public function storeProvince(ProvinceRequest $request): RedirectResponse
    {
        try {
            $province = Province::create($request->validated());
            return back()->with('success', "Provincia «{$province->name}» creada.");
        } catch (\Throwable) {
            return back()->with('error', 'No se pudo crear la provincia.');
        }
    }

    public function updateProvince(ProvinceRequest $request, Province $province): RedirectResponse
    {
        try {
            $province->update($request->validated());
            return back()->with('success', "Provincia «{$province->name}» actualizada.");
        } catch (\Throwable) {
            return back()->with('error', 'No se pudo actualizar la provincia.');
        }
    }

    public function destroyProvince(Province $province): RedirectResponse
    {
        try {
            $name = $province->name;
            $province->delete();
            return back()->with('success', "Provincia «{$name}» eliminada.");
        } catch (\Throwable) {
            return back()->with('error', 'No se pudo eliminar. Puede tener distritos asociados.');
        }
    }

    // ── Distritos ──────────────────────────────────────────────────────────────

    public function storeDistrict(DistrictRequest $request): RedirectResponse
    {
        try {
            $district = District::create($request->validated());
            return back()->with('success', "Distrito «{$district->name}» creado.");
        } catch (\Throwable) {
            return back()->with('error', 'No se pudo crear el distrito.');
        }
    }

    public function updateDistrict(DistrictRequest $request, District $district): RedirectResponse
    {
        try {
            $district->update($request->validated());
            return back()->with('success', "Distrito «{$district->name}» actualizado.");
        } catch (\Throwable) {
            return back()->with('error', 'No se pudo actualizar el distrito.');
        }
    }

    public function destroyDistrict(District $district): RedirectResponse
    {
        try {
            $name = $district->name;
            $district->delete();
            return back()->with('success', "Distrito «{$name}» eliminado.");
        } catch (\Throwable) {
            return back()->with('error', 'No se pudo eliminar el distrito.');
        }
    }
}
