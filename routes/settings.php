<?php

use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Support\Facades\Route;

// Solo panel administrativo (super_admin y dueño con negocio aprobado).
Route::middleware(['auth', 'verified', 'restaurant.owner.approved', 'restaurant.owner.post_setup', 'role:super_admin|restaurant_owner'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');

    Route::patch('settings/restaurant-profile', [ProfileController::class, 'updateRestaurantProfile'])
        ->name('profile.restaurant.update');

    Route::get('settings/security', [SecurityController::class, 'edit'])->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');
});
