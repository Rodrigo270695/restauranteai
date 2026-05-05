<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class OwnerPendingController extends Controller
{
    public function show(Request $request): mixed
    {
        $user = $request->user();

        if (! $user->hasRole('restaurant_owner')) {
            return Redirect::route('dashboard');
        }

        $profile = $user->restaurantProfile;

        // Si ya fue aprobado, redirigir al panel de dueño (cuando exista)
        if ($profile?->isApproved()) {
            if ($profile->needsPostApprovalOnboarding()) {
                return Redirect::route('profile.edit');
            }

            return Redirect::route('dashboard');
        }

        return Inertia::render('owner/pending', [
            'user' => [
                'name'  => $user->name,
                'email' => $user->email,
            ],
            'restaurant' => $profile ? [
                'business_name'    => $profile->business_name,
                'city'             => $profile->city,
                'phone'            => $profile->phone,
                'status'           => $profile->status,
                'rejection_reason' => $profile->rejection_reason,
                'submitted_at'     => $profile->created_at?->toISOString(),
            ] : null,
        ]);
    }
}
