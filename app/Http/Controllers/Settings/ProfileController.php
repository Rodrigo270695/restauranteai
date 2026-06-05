<?php

namespace App\Http\Controllers\Settings;

use App\Models\RestaurantProfile;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        $profile = $request->user()->restaurantProfile;

        return Inertia::render('settings/profile', [
            'mustVerifyEmail'   => $request->user() instanceof MustVerifyEmail,
            'status'            => $request->session()->get('status') ?? (
                $profile?->needsPostApprovalOnboarding() ? 'complete-local' : null
            ),
            'restaurantProfile' => $profile,
        ]);
    }

    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return to_route('profile.edit')->with('status', 'profile-updated');
    }

    public function updateRestaurantProfile(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'description' => ['nullable', 'string', 'max:1000'],
            'address'     => ['nullable', 'string', 'max:500'],
            'district'    => ['nullable', 'string', 'max:100'],
            'phone'       => ['nullable', 'string', 'max:20'],
            'website'     => ['nullable', 'url', 'max:255'],
        ]);

        $profile = $request->user()->restaurantProfile;
        $profile?->update($validated);

        $profile?->refresh();
        if ($profile && $profile->isApproved() && $profile->isProfileComplete() && $profile->post_approval_completed_at === null) {
            RestaurantProfile::query()
                ->whereKey($profile->id)
                ->whereNull('post_approval_completed_at')
                ->update(['post_approval_completed_at' => now()]);
        }

        return to_route('profile.edit')->with('status', 'restaurant-updated');
    }
}
