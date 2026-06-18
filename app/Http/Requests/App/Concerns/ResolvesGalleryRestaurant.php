<?php

namespace App\Http\Requests\App\Concerns;

use App\Models\Restaurant;
use App\Models\RestaurantImage;
use App\Services\RestaurantScopeService;
use Illuminate\Http\Request;

trait ResolvesGalleryRestaurant
{
    protected function resolveGalleryRestaurant(Request $request, RestaurantScopeService $scope): ?Restaurant
    {
        $bound = $request->route('restaurant');
        if ($bound instanceof Restaurant) {
            return $bound;
        }

        $image = $request->route('image');
        if ($image instanceof RestaurantImage) {
            return $image->restaurant;
        }

        try {
            return $scope->forOwnerPanel($request);
        } catch (\Throwable) {
            return null;
        }
    }
}
