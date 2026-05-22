<?php

namespace App\Services;

use App\Models\Restaurant;

class RestaurantCuisineService
{
    /**
     * @param  array<int>  $cuisineTypeIds
     */
    public function sync(Restaurant $restaurant, array $cuisineTypeIds, ?int $primaryCuisineTypeId = null): void
    {
        $ids = array_values(array_unique(array_map('intval', $cuisineTypeIds)));

        if ($ids === []) {
            $restaurant->cuisineTypes()->detach();
            $restaurant->forceFill(['cuisine_type_id' => null])->save();

            return;
        }

        $primary = $primaryCuisineTypeId && in_array($primaryCuisineTypeId, $ids, true)
            ? $primaryCuisineTypeId
            : $ids[0];

        $sync = [];
        foreach ($ids as $id) {
            $sync[$id] = ['is_primary' => $id === $primary];
        }

        $restaurant->cuisineTypes()->sync($sync);
        $restaurant->forceFill(['cuisine_type_id' => $primary])->save();
    }
}
