<?php

namespace App\Support;

use App\Models\Restaurant;
use App\Services\RestaurantScopeService;

final class OwnerPanel
{
    /** @return array<string, mixed> */
    public static function props(Restaurant $restaurant, bool $admin = false): array
    {
        $scope = app(RestaurantScopeService::class);

        $restaurant->loadMissing(['owner.restaurantProfile']);

        return [
            'restaurant' => ['id' => $restaurant->id, 'name' => $restaurant->name],
            'owner' => $scope->ownerContext($restaurant),
            'panel' => [
                'mode' => $admin ? 'admin' : 'owner',
                'baseUrl' => $admin ? '/app/admin/restaurants/'.$restaurant->id : null,
                'hubUrl' => $admin ? '/app/admin/restaurants/'.$restaurant->id : null,
                'readOnly' => false,
            ],
        ];
    }

    public static function saveUrl(Restaurant $restaurant, bool $admin, string $segment): string
    {
        if ($admin) {
            return '/app/admin/restaurants/'.$restaurant->id.$segment;
        }

        return '/app'.$segment;
    }
}
