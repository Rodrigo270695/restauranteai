<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RestaurantProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BusinessRequestController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('business_requests.view'), 403);

        $status = $request->string('status')->toString();
        $perPage = in_array((int) $request->input('per_page'), [10, 15, 25, 50]) ? (int) $request->input('per_page') : 15;

        $items = RestaurantProfile::query()
            ->with('user:id,name,email')
            ->when(in_array($status, ['pending', 'approved', 'rejected'], true), fn ($q) => $q->where('status', $status))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('app/admin/business-requests', [
            'items' => $items,
            'filters' => ['status' => $status ?: null],
            'stats' => [
                'pending' => RestaurantProfile::where('status', 'pending')->count(),
                'approved' => RestaurantProfile::where('status', 'approved')->count(),
                'rejected' => RestaurantProfile::where('status', 'rejected')->count(),
            ],
        ]);
    }

    public function updateStatus(Request $request, RestaurantProfile $profile): RedirectResponse
    {
        abort_unless($request->user()?->can('business_requests.manage'), 403);

        $data = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'rejection_reason' => ['nullable', 'string', 'required_if:status,rejected'],
        ]);

        $profile->update([
            'status' => $data['status'],
            'rejection_reason' => $data['status'] === 'rejected' ? ($data['rejection_reason'] ?? null) : null,
            'approved_at' => $data['status'] === 'approved' ? now() : null,
            'approved_by' => $data['status'] === 'approved' ? $request->user()->id : null,
        ]);

        return back()->with('success', 'Solicitud actualizada.');
    }
}
