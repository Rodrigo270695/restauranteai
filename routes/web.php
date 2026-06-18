<?php

use App\Http\Controllers\Admin\AdminAnalyticsController;
use App\Http\Controllers\Admin\AdminReservationController;
use App\Http\Controllers\Admin\AdminReviewController;
use App\Http\Controllers\Admin\BusinessRequestController;
use App\Http\Controllers\Admin\CatalogController;
use App\Http\Controllers\Admin\GeographyController;
use App\Http\Controllers\Admin\MlTrainingController;
use App\Http\Controllers\Admin\ReadOnlyDataController;
use App\Http\Controllers\Admin\RestaurantController as AdminRestaurantController;
use App\Http\Controllers\Admin\RestaurantHubController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\App\AnalyticsController;
use App\Http\Controllers\App\DishController;
use App\Http\Controllers\App\GalleryController;
use App\Http\Controllers\App\PromotionController;
use App\Http\Controllers\App\ReservationController;
use App\Http\Controllers\App\RestaurantController as AppRestaurantController;
use App\Http\Controllers\App\RestaurantLanguagesController;
use App\Http\Controllers\App\RestaurantServicesController;
use App\Http\Controllers\App\ReviewController;
use App\Http\Controllers\App\ScheduleController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\AuthenticatedHomeController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExploreController;
use App\Http\Controllers\ExploreDiscoverController;
use App\Http\Controllers\ExploreRecommendationController;
use App\Http\Controllers\ExploreReservationController;
use App\Http\Controllers\ExploreRestaurantController;
use App\Http\Controllers\ExploreRestaurantInteractionController;
use App\Http\Controllers\ExploreReviewController;
use App\Http\Controllers\ExploreRouteRecommendationController;
use App\Http\Controllers\NearbyRestaurantsController;
use App\Http\Controllers\OwnerPendingController;
use App\Http\Controllers\PublicRestaurantController;
use App\Http\Controllers\RucValidationController;
use App\Http\Controllers\TamSurveyController;
use App\Http\Controllers\TouristProfileController;
use App\Http\Controllers\TouristRouteController;
use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;

Route::get('/', WelcomeController::class)->name('home');
Route::middleware('auth')->get('/inicio', AuthenticatedHomeController::class)->name('authenticated.home');
Route::get('/restaurantes-cercanos', NearbyRestaurantsController::class)->name('restaurants.nearby');
Route::redirect('/restaurantes', '/restaurantes-cercanos');
Route::get('/restaurantes/{restaurant:slug}', [PublicRestaurantController::class, 'show'])->name('restaurants.public.show');

Route::get('/contacto', [ContactController::class, 'show'])->name('contact.show');
Route::post('/contacto', [ContactController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('contact.store');

// ── Portal Administrativo (super_admin y restaurant_owner aprobado) ───────────
Route::middleware(['auth', 'verified', 'restaurant.owner.approved', 'restaurant.owner.post_setup', 'role:super_admin|restaurant_owner'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::prefix('app')->name('app.')->group(function () {
        // Panel del dueño (super_admin solo con suplantación activa)
        Route::middleware(['restaurant.owner.context', 'restaurant.owner.mutate'])->group(function () {
            Route::get('restaurants', [AppRestaurantController::class, 'index'])->name('restaurants');
            Route::put('restaurants', [AppRestaurantController::class, 'update'])->name('restaurants.update');
            Route::post('restaurants/locations', [AppRestaurantController::class, 'storeLocation'])->name('restaurants.locations.store');
            Route::post('restaurants/switch', [AppRestaurantController::class, 'switchLocation'])->name('restaurants.switch');
            Route::post('restaurants/geocode', [AppRestaurantController::class, 'geocodeAddress'])->name('restaurants.geocode');

            Route::get('schedules', [ScheduleController::class, 'index'])->name('schedules');
            Route::put('schedules', [ScheduleController::class, 'sync'])->name('schedules.sync');

            Route::get('gallery', [GalleryController::class, 'index'])->name('gallery');
            Route::post('gallery', [GalleryController::class, 'store'])->name('gallery.store');
            Route::post('gallery/{image}/detach', [GalleryController::class, 'destroy'])->name('gallery.detach');
            Route::post('gallery/{image}/unlink', [GalleryController::class, 'destroy'])->name('gallery.unlink');
            Route::post('gallery/{image}/cover', [GalleryController::class, 'setCover'])->name('gallery.cover');
            Route::post('gallery/{image}/update', [GalleryController::class, 'updateGalleryImage'])->name('gallery.update.post');
            Route::post('gallery/{image}', [GalleryController::class, 'destroy'])->name('gallery.destroy.post');
            Route::put('gallery/{image}', [GalleryController::class, 'updateGalleryImage'])->name('gallery.update');
            Route::delete('gallery/{image}', [GalleryController::class, 'destroy'])->name('gallery.destroy');

            Route::get('restaurant-services', [RestaurantServicesController::class, 'index'])->name('restaurant-services');
            Route::put('restaurant-services', [RestaurantServicesController::class, 'sync'])->name('restaurant-services.sync');

            Route::get('restaurant-languages', [RestaurantLanguagesController::class, 'index'])->name('restaurant-languages');
            Route::put('restaurant-languages', [RestaurantLanguagesController::class, 'sync'])->name('restaurant-languages.sync');

            Route::get('dishes', [DishController::class, 'index'])->name('dishes');
            Route::post('dishes', [DishController::class, 'store'])->name('dishes.store');
            Route::match(['put', 'post'], 'dishes/{dish}', [DishController::class, 'update'])->name('dishes.update');
            Route::delete('dishes/{dish}', [DishController::class, 'destroy'])->name('dishes.destroy');

            Route::get('promotions', [PromotionController::class, 'index'])->name('promotions');
            Route::post('promotions', [PromotionController::class, 'store'])->name('promotions.store');
            Route::match(['put', 'post'], 'promotions/{promotion}', [PromotionController::class, 'update'])->name('promotions.update');
            Route::delete('promotions/{promotion}', [PromotionController::class, 'destroy'])->name('promotions.destroy');

            Route::get('reviews', [ReviewController::class, 'index'])->name('reviews');
            Route::put('reviews/{review}/respond', [ReviewController::class, 'respond'])->name('reviews.respond');

            Route::get('reservations', [ReservationController::class, 'index'])->name('reservations');
            Route::post('reservations/{reservation}/confirm', [ReservationController::class, 'confirm'])->name('reservations.confirm');
            Route::post('reservations/{reservation}/reject', [ReservationController::class, 'reject'])->name('reservations.reject');

            Route::get('analytics', [AnalyticsController::class, 'index'])->name('analytics');
        });

        Route::middleware('role:super_admin')->prefix('admin')->name('admin.')->group(function () {
            Route::post('stop-impersonating', [RestaurantHubController::class, 'stopImpersonating'])->name('stop-impersonating');

            Route::get('reviews', [AdminReviewController::class, 'index'])->name('reviews');
            Route::put('reviews/{review}/respond', [AdminReviewController::class, 'respond'])->name('reviews.respond');

            Route::get('reservations', [AdminReservationController::class, 'index'])->name('reservations');
            Route::post('reservations/{reservation}/confirm', [AdminReservationController::class, 'confirm'])->name('reservations.confirm');
            Route::post('reservations/{reservation}/reject', [AdminReservationController::class, 'reject'])->name('reservations.reject');

            Route::get('analytics', [AdminAnalyticsController::class, 'index'])->name('analytics');

            Route::get('roles', [RoleController::class, 'index'])->name('roles');
            Route::post('roles', [RoleController::class, 'store'])->name('roles.store');
            Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update');
            Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');

            Route::get('users', [UserController::class, 'index'])->name('users');
            Route::post('users', [UserController::class, 'store'])->name('users.store');
            Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
            Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
            Route::post('users/{user}/approve-restaurant', [UserController::class, 'approveRestaurant'])->name('users.approve-restaurant');

            Route::get('restaurants', [AdminRestaurantController::class, 'index'])->name('restaurants');
            Route::post('restaurants', [AdminRestaurantController::class, 'store'])->name('restaurants.store');
            Route::put('restaurants/{restaurant:id}', [AdminRestaurantController::class, 'update'])->name('restaurants.update');
            Route::delete('restaurants/{restaurant:id}', [AdminRestaurantController::class, 'destroy'])->name('restaurants.destroy');

            Route::prefix('restaurants/{restaurant:id}')->name('restaurants.manage.')->group(function () {
                Route::get('/', [RestaurantHubController::class, 'show'])->name('show');
                Route::post('impersonate', [RestaurantHubController::class, 'impersonate'])->name('impersonate');

                Route::get('profile', [AppRestaurantController::class, 'indexForRestaurant'])->name('profile');
                Route::put('profile', [AppRestaurantController::class, 'update'])->name('profile.update');
                Route::post('geocode', [AppRestaurantController::class, 'geocodeAddress'])->name('geocode');

                Route::get('schedules', [ScheduleController::class, 'indexForRestaurant'])->name('schedules');
                Route::put('schedules', [ScheduleController::class, 'sync'])->name('schedules.sync');

                Route::get('gallery', [GalleryController::class, 'indexForRestaurant'])->name('gallery');
                Route::post('gallery', [GalleryController::class, 'storeForRestaurant'])->name('gallery.store');
                Route::post('gallery/{image}/detach', [GalleryController::class, 'destroyForRestaurant'])->name('gallery.detach');
                Route::post('gallery/{image}/unlink', [GalleryController::class, 'destroyForRestaurant'])->name('gallery.unlink');
                Route::post('gallery/{image}/cover', [GalleryController::class, 'setCoverForRestaurant'])->name('gallery.cover');
                Route::post('gallery/{image}/update', [GalleryController::class, 'updateGalleryImageForRestaurant'])->name('gallery.update.post');
                Route::post('gallery/{image}', [GalleryController::class, 'destroyForRestaurant'])->name('gallery.destroy.post');
                Route::put('gallery/{image}', [GalleryController::class, 'updateGalleryImageForRestaurant'])->name('gallery.update');
                Route::delete('gallery/{image}', [GalleryController::class, 'destroyForRestaurant'])->name('gallery.destroy');

                Route::get('services', [RestaurantServicesController::class, 'indexForRestaurant'])->name('services');
                Route::put('services', [RestaurantServicesController::class, 'sync'])->name('services.sync');

                Route::get('languages', [RestaurantLanguagesController::class, 'indexForRestaurant'])->name('languages');
                Route::put('languages', [RestaurantLanguagesController::class, 'sync'])->name('languages.sync');

                Route::get('dishes', [DishController::class, 'indexForRestaurant'])->name('dishes');
                Route::post('dishes', [DishController::class, 'store'])->name('dishes.store');
                Route::match(['put', 'post'], 'dishes/{dish}', [DishController::class, 'update'])->name('dishes.update');
                Route::delete('dishes/{dish}', [DishController::class, 'destroy'])->name('dishes.destroy');

                Route::get('promotions', [PromotionController::class, 'indexForRestaurant'])->name('promotions');
                Route::post('promotions', [PromotionController::class, 'store'])->name('promotions.store');
                Route::match(['put', 'post'], 'promotions/{promotion}', [PromotionController::class, 'update'])->name('promotions.update');
                Route::delete('promotions/{promotion}', [PromotionController::class, 'destroy'])->name('promotions.destroy');

                Route::get('analytics', [AnalyticsController::class, 'indexForRestaurant'])->name('analytics');

                Route::get('reservations', [ReservationController::class, 'indexForRestaurant'])->name('reservations');
                Route::post('reservations/{reservation}/confirm', [ReservationController::class, 'confirmForRestaurant'])->name('reservations.confirm');
                Route::post('reservations/{reservation}/reject', [ReservationController::class, 'rejectForRestaurant'])->name('reservations.reject');
            });

            Route::get('business-requests', [BusinessRequestController::class, 'index'])->name('business-requests');
            Route::patch('business-requests/{profile}', [BusinessRequestController::class, 'updateStatus'])->name('business-requests.update');

            Route::get('geography', [GeographyController::class, 'index'])->name('geography');
            Route::post('geography/departments', [GeographyController::class, 'storeDepartment'])->name('geography.departments.store');
            Route::put('geography/departments/{department}', [GeographyController::class, 'updateDepartment'])->name('geography.departments.update');
            Route::delete('geography/departments/{department}', [GeographyController::class, 'destroyDepartment'])->name('geography.departments.destroy');
            Route::post('geography/provinces', [GeographyController::class, 'storeProvince'])->name('geography.provinces.store');
            Route::put('geography/provinces/{province}', [GeographyController::class, 'updateProvince'])->name('geography.provinces.update');
            Route::delete('geography/provinces/{province}', [GeographyController::class, 'destroyProvince'])->name('geography.provinces.destroy');
            Route::post('geography/districts', [GeographyController::class, 'storeDistrict'])->name('geography.districts.store');
            Route::put('geography/districts/{district}', [GeographyController::class, 'updateDistrict'])->name('geography.districts.update');
            Route::delete('geography/districts/{district}', [GeographyController::class, 'destroyDistrict'])->name('geography.districts.destroy');

            $catalogs = [
                'cuisine-types' => 'cuisine_types',
                'ambiances' => 'ambiances',
                'services' => 'services',
                'dish-categories' => 'dish_categories',
                'support-languages' => 'languages',
                'party-types' => 'party_types',
                'dietary-options' => 'dietary_options',
                'restaurant-environments' => 'restaurant_environments',
                'recommended-moments' => 'recommended_moments',
            ];
            foreach ($catalogs as $path => $key) {
                Route::get($path, [CatalogController::class, 'index'])->defaults('catalog', $key)->name(str_replace('-', '_', $path));
                Route::post($path, [CatalogController::class, 'store'])->defaults('catalog', $key)->name(str_replace('-', '_', $path).'.store');
                Route::put("{$path}/{item}", [CatalogController::class, 'update'])->defaults('catalog', $key)->name(str_replace('-', '_', $path).'.update');
                Route::delete("{$path}/{item}", [CatalogController::class, 'destroy'])->defaults('catalog', $key)->name(str_replace('-', '_', $path).'.destroy');
            }

            Route::get('ml-training', [MlTrainingController::class, 'index'])->name('ml-training.index');
            Route::post('ml-training', [MlTrainingController::class, 'store'])->name('ml-training.store');

            Route::get('user-interactions', [ReadOnlyDataController::class, 'userInteractions'])->name('user-interactions');
            Route::get('recommendation-requests', [ReadOnlyDataController::class, 'recommendationRequests'])->name('recommendation-requests');
            Route::get('recommendations', [ReadOnlyDataController::class, 'recommendations'])->name('recommendations');
            Route::get('tam-surveys', [ReadOnlyDataController::class, 'tamSurveys'])->name('tam-surveys');
        });
    });
});

// ── Portal Turista ────────────────────────────────────────────────────────────
Route::middleware(['auth', 'verified'])->prefix('explore')->name('explore.')->group(function () {
    Route::get('/', [ExploreController::class, 'index'])->name('index');
    Route::get('/discover', ExploreDiscoverController::class)->name('discover');
    Route::post('/recommend', ExploreRecommendationController::class)->name('recommend');
    Route::post('/routes/recommend', ExploreRouteRecommendationController::class)->name('routes.recommend');
    Route::get('/restaurants/{restaurant:slug}', [ExploreRestaurantController::class, 'show'])->name('restaurants.show');
    Route::post('/restaurants/{restaurant:slug}/interactions', [ExploreRestaurantInteractionController::class, 'store'])
        ->name('restaurants.interactions');
    Route::post('/restaurants/{restaurant:slug}/reviews', [ExploreReviewController::class, 'store'])
        ->name('restaurants.reviews');
    Route::post('/routes/{route:slug}/stops/{restaurant:slug}/reservations', [ExploreReservationController::class, 'store'])
        ->name('routes.reservations.store');
    Route::post('/reservations/{reservation}/confirm', [ExploreReservationController::class, 'confirm'])
        ->name('reservations.confirm');
    Route::post('/reservations/{reservation}/visited', [ExploreReservationController::class, 'markVisited'])
        ->name('reservations.visited');
    Route::post('/reservations/{reservation}/cancel', [ExploreReservationController::class, 'cancel'])
        ->name('reservations.cancel');
    Route::get('/profile', [ExploreController::class, 'profile'])->name('profile');
    Route::post('/profile', [ExploreController::class, 'updateProfile'])->name('profile.update');
    Route::get('/tam-survey', [TamSurveyController::class, 'show'])->name('tam-survey');
    Route::post('/tam-survey', [TamSurveyController::class, 'store'])->name('tam-survey.store');

    Route::prefix('routes')->name('routes.')->group(function () {
        Route::get('/', [TouristRouteController::class, 'index'])->name('index');
        Route::post('/publish', [TouristRouteController::class, 'publish'])->name('publish');
        Route::post('/{route:slug}/complete', [TouristRouteController::class, 'complete'])->name('complete');
        Route::post('/stops/{restaurant}', [TouristRouteController::class, 'addStop'])->name('stops.add');
        Route::delete('/stops/{restaurant}', [TouristRouteController::class, 'removeStop'])->name('stops.remove');
        Route::get('/{route:slug}', [TouristRouteController::class, 'show'])->name('show');
        Route::delete('/{route}', [TouristRouteController::class, 'destroy'])->name('destroy');
    });
});

// ── Setup de perfil turista + owner pending ─────────────────────────────────────
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('profile/setup', [TouristProfileController::class, 'show'])->name('profile.setup');
    Route::post('profile/setup', [TouristProfileController::class, 'store'])->name('profile.setup.store');
    Route::get('owner/pending', [OwnerPendingController::class, 'show'])->name('owner.pending');
    Route::redirect('owner/profile/setup', '/settings/profile')->name('owner.profile.setup');
});

Route::get('api/ruc/{ruc}', [RucValidationController::class, 'validate'])->name('ruc.validate');

Route::prefix('auth')->name('auth.social.')->group(function () {
    Route::get('{provider}/redirect', [SocialAuthController::class, 'redirect'])->name('redirect');
    Route::get('{provider}/callback', [SocialAuthController::class, 'callback'])->name('callback');
});

require __DIR__.'/settings.php';
