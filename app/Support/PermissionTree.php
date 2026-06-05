<?php

namespace App\Support;

class PermissionTree
{
    /** @return list<string> */
    public static function allNames(): array
    {
        $names = [];
        foreach (config('permissions') as $module) {
            foreach ($module['items'] as $item) {
                foreach (array_keys($item['permissions']) as $name) {
                    $names[] = $name;
                }
            }
        }

        return $names;
    }

    /** Permisos asignados por defecto al dueño de restaurante. */
    public static function restaurantOwnerDefaults(): array
    {
        return [
            'dashboard.view',
            'manage_own_restaurant',
            'manage_schedules',
            'manage_gallery',
            'manage_restaurant_services',
            'manage_restaurant_languages',
            'manage_dishes',
            'manage_promotions',
            'reviews.view',
            'reservations.view',
            'reservations.manage',
            'view_analytics',
        ];
    }
}
