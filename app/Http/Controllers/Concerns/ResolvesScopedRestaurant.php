<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Restaurant;
use App\Services\RestaurantScopeService;
use Illuminate\Http\Request;

trait ResolvesScopedRestaurant
{
    protected function scopedRestaurant(Request $request, RestaurantScopeService $scope, ?Restaurant $restaurant = null): Restaurant
    {
        if ($restaurant) {
            return $scope->forAdminManage($request->user(), $restaurant);
        }

        return $scope->forOwnerPanel($request);
    }
}
