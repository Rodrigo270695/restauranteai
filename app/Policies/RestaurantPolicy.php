<?php

namespace App\Policies;

use App\Models\Restaurant;
use App\Models\User;
use App\Services\RestaurantScopeService;

class RestaurantPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('restaurants.view');
    }

    public function view(User $user, Restaurant $restaurant): bool
    {
        return $user->hasRole('super_admin') && $user->can('restaurants.view')
            || $restaurant->owner_id === $user->id;
    }

    public function manage(User $user, Restaurant $restaurant): bool
    {
        if ($user->hasRole('super_admin') && $user->can('restaurants.view')) {
            return true;
        }

        return $restaurant->owner_id === $user->id;
    }

    public function update(User $user, Restaurant $restaurant): bool
    {
        if ($user->hasRole('super_admin')) {
            return $user->can('restaurants.edit');
        }

        return $restaurant->owner_id === $user->id && $user->can('manage_own_restaurant');
    }
}
