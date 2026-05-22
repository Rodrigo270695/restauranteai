<?php

namespace App\Services;

use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Support\Str;

class OwnerRestaurantService
{
    public function __construct(
        private readonly RestaurantScopeService $scope,
    ) {}

    /** @deprecated Usar RestaurantScopeService::forOwnerPanel() */
    public function resolve(User $user): Restaurant
    {
        if ($user->hasRole('super_admin') && ! $user->hasRole('restaurant_owner')) {
            abort(403, 'Use Administración → Restaurantes para gestionar locales.');
        }

        return $this->scope->resolveOwnedRestaurant($user);
    }
}
