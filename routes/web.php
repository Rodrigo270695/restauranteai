<?php

use App\Http\Controllers\Admin\GeographyController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\ExploreController;
use App\Http\Controllers\OwnerPendingController;
use App\Http\Controllers\RucValidationController;
use App\Http\Controllers\TouristProfileController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

// ── Portal Administrativo (super_admin y restaurant_owner aprobado) ───────────
Route::middleware(['auth', 'verified', 'restaurant.owner.approved', 'restaurant.owner.post_setup', 'role:super_admin|restaurant_owner'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::prefix('app')->name('app.')->group(function () {
        Route::inertia('restaurants', 'app/restaurants')->name('restaurants');
        Route::inertia('schedules', 'app/schedules')->name('schedules');
        Route::inertia('gallery', 'app/gallery')->name('gallery');
        Route::inertia('restaurant-services', 'app/restaurant-services')->name('restaurant-services');
        Route::inertia('restaurant-languages', 'app/restaurant-languages')->name('restaurant-languages');
        Route::inertia('dishes', 'app/dishes')->name('dishes');
        Route::inertia('promotions', 'app/promotions')->name('promotions');
        Route::inertia('reviews', 'app/reviews')->name('reviews');
        Route::inertia('analytics', 'app/analytics')->name('analytics');

        Route::middleware('role:super_admin')->prefix('admin')->name('admin.')->group(function () {
            // Roles — CRUD completo
            Route::get('roles',             [RoleController::class, 'index'])->name('roles');
            Route::post('roles',            [RoleController::class, 'store'])->name('roles.store');
            Route::put('roles/{role}',      [RoleController::class, 'update'])->name('roles.update');
            Route::delete('roles/{role}',   [RoleController::class, 'destroy'])->name('roles.destroy');
            Route::get('users',             [UserController::class, 'index'])->name('users');
            Route::post('users',            [UserController::class, 'store'])->name('users.store');
            Route::put('users/{user}',      [UserController::class, 'update'])->name('users.update');
            Route::delete('users/{user}',   [UserController::class, 'destroy'])->name('users.destroy');
            Route::post('users/{user}/approve-restaurant', [UserController::class, 'approveRestaurant'])->name('users.approve-restaurant');
            Route::inertia('restaurants', 'app/admin/restaurants')->name('restaurants');
            Route::inertia('business-requests', 'app/admin/business-requests')->name('business-requests');
            // Geografía — CRUD departamentos, provincias, distritos
            Route::get('geography', [GeographyController::class, 'index'])->name('geography');
            Route::post('geography/departments',              [GeographyController::class, 'storeDepartment'])->name('geography.departments.store');
            Route::put('geography/departments/{department}',  [GeographyController::class, 'updateDepartment'])->name('geography.departments.update');
            Route::delete('geography/departments/{department}',[GeographyController::class, 'destroyDepartment'])->name('geography.departments.destroy');
            Route::post('geography/provinces',                [GeographyController::class, 'storeProvince'])->name('geography.provinces.store');
            Route::put('geography/provinces/{province}',      [GeographyController::class, 'updateProvince'])->name('geography.provinces.update');
            Route::delete('geography/provinces/{province}',   [GeographyController::class, 'destroyProvince'])->name('geography.provinces.destroy');
            Route::post('geography/districts',                [GeographyController::class, 'storeDistrict'])->name('geography.districts.store');
            Route::put('geography/districts/{district}',      [GeographyController::class, 'updateDistrict'])->name('geography.districts.update');
            Route::delete('geography/districts/{district}',   [GeographyController::class, 'destroyDistrict'])->name('geography.districts.destroy');
            Route::inertia('cuisine-types', 'app/admin/cuisine-types')->name('cuisine-types');
            Route::inertia('ambiances', 'app/admin/ambiances')->name('ambiances');
            Route::inertia('services', 'app/admin/services')->name('services');
            Route::inertia('dish-categories', 'app/admin/dish-categories')->name('dish-categories');
            Route::inertia('support-languages', 'app/admin/support-languages')->name('support-languages');
            Route::inertia('user-interactions', 'app/admin/user-interactions')->name('user-interactions');
            Route::inertia('recommendation-requests', 'app/admin/recommendation-requests')->name('recommendation-requests');
            Route::inertia('recommendations', 'app/admin/recommendations')->name('recommendations');
            Route::inertia('tam-surveys', 'app/admin/tam-surveys')->name('tam-surveys');
        });
    });
});

// ── Portal Turista ────────────────────────────────────────────────────────────
Route::middleware(['auth', 'verified'])->prefix('explore')->name('explore.')->group(function () {
    Route::get('/',        [ExploreController::class, 'index'])->name('index');
    Route::get('/profile', [ExploreController::class, 'profile'])->name('profile');
    Route::post('/profile', [ExploreController::class, 'updateProfile'])->name('profile.update');
});

// ── Setup de perfil turista + owner pending (requieren email verificado) ──────
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('profile/setup',  [TouristProfileController::class, 'show'])->name('profile.setup');
    Route::post('profile/setup', [TouristProfileController::class, 'store'])->name('profile.setup.store');

    Route::get('owner/pending', [OwnerPendingController::class, 'show'])->name('owner.pending');

    // URL antigua del wizard: ahora el perfil del restaurante se completa en Configuración → Perfil
    Route::redirect('owner/profile/setup', '/settings/profile')->name('owner.profile.setup');
});

// ── Validación de RUC via SUNAT (pública — se usa durante el registro) ────────
Route::get('api/ruc/{ruc}', [RucValidationController::class, 'validate'])
    ->name('ruc.validate');

// ── OAuth Social Login ────────────────────────────────────────────────────────
Route::prefix('auth')->name('auth.social.')->group(function () {
    Route::get('{provider}/redirect', [SocialAuthController::class, 'redirect'])->name('redirect');
    Route::get('{provider}/callback', [SocialAuthController::class, 'callback'])->name('callback');
});

require __DIR__.'/settings.php';
