<?php

namespace App\Support;

use App\Models\Dish;
use App\Models\Restaurant;
use Illuminate\Support\Collection;

class RestaurantMenuPresenter
{
    /**
     * Carta agrupada por categoría (bebidas, platos de fondo, etc.).
     *
     * @return array{sections: list<array{id: int|null, name: string, slug: string, items: list<array<string, mixed>>}>, total_items: int}
     */
    public static function forRestaurant(Restaurant $restaurant): array
    {
        $dishes = $restaurant->dishes()
            ->where('is_available', true)
            ->with(['category:id,name,slug,display_order'])
            ->orderBy('display_order')
            ->orderBy('name')
            ->get();

        return self::fromCollection($dishes);
    }

    /**
     * @param  Collection<int, Dish>  $dishes
     * @return array{sections: list<array{id: int|null, name: string, slug: string, items: list<array<string, mixed>>}>, total_items: int}
     */
    public static function fromCollection(Collection $dishes): array
    {
        /** @var array<int, array{id: int, name: string, slug: string, display_order: int, items: list<array<string, mixed>>}> $byCategory */
        $byCategory = [];
        $uncategorized = [];

        foreach ($dishes as $dish) {
            $item = self::formatDish($dish);
            $category = $dish->category;

            if ($category === null) {
                $uncategorized[] = $item;

                continue;
            }

            if (! isset($byCategory[$category->id])) {
                $byCategory[$category->id] = [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'display_order' => (int) $category->display_order,
                    'items' => [],
                ];
            }

            $byCategory[$category->id]['items'][] = $item;
        }

        $sections = collect($byCategory)
            ->sortBy('display_order')
            ->values()
            ->map(fn (array $section) => [
                'id' => $section['id'],
                'name' => $section['name'],
                'slug' => $section['slug'],
                'items' => $section['items'],
            ])
            ->all();

        if ($uncategorized !== []) {
            $sections[] = [
                'id' => null,
                'name' => 'Otros',
                'slug' => 'otros',
                'items' => $uncategorized,
            ];
        }

        return [
            'sections' => $sections,
            'total_items' => $dishes->count(),
        ];
    }

    /** @return array<string, mixed> */
    private static function formatDish(Dish $dish): array
    {
        return [
            'id' => $dish->id,
            'name' => $dish->name,
            'description' => $dish->description,
            'price' => (float) $dish->price,
            'image_url' => $dish->image ? PublicStorage::url($dish->image) : null,
            'is_signature' => (bool) $dish->is_signature,
            'is_featured' => (bool) $dish->is_featured,
        ];
    }
}
