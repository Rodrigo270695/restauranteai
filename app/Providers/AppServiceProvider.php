<?php

namespace App\Providers;

use App\Models\Restaurant;
use App\Models\RestaurantImage;
use App\Policies\RestaurantPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureRouteBindings();
        Gate::policy(Restaurant::class, RestaurantPolicy::class);
    }

    protected function configureRouteBindings(): void
    {
        Route::pattern('image', '[0-9]+');

        Route::bind('image', function (string $value, $route): RestaurantImage {
            $image = RestaurantImage::query()->findOrFail($value);

            $restaurant = $route->parameter('restaurant');
            $restaurantId = $restaurant instanceof Restaurant
                ? $restaurant->id
                : (is_numeric($restaurant) ? (int) $restaurant : null);

            if ($restaurantId !== null && $image->restaurant_id !== $restaurantId) {
                abort(404);
            }

            return $image;
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
