<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use App\Support\PriceRange;
use App\Support\PublicStorage;
use App\Support\RestaurantHoursPresenter;
use App\Support\RestaurantMenuPresenter;
use Inertia\Inertia;

class PublicRestaurantController extends Controller
{
    public function show(Restaurant $restaurant, RestaurantHoursPresenter $hours): mixed
    {
        abort_unless($restaurant->is_active && $restaurant->is_verified, 404);

        $restaurant->load([
            'cuisineTypes:id,name',
            'cuisineType:id,name',
            'district:id,name',
            'schedules',
            'images' => fn ($q) => $q->orderByDesc('is_cover')->orderBy('display_order'),
        ]);

        $cuisines = $restaurant->cuisineTypes->isNotEmpty()
            ? $restaurant->cuisineTypes
            : ($restaurant->cuisineType ? collect([$restaurant->cuisineType]) : collect());

        return Inertia::render('public/restaurants/show', [
            'restaurant' => [
                'name' => $restaurant->name,
                'slug' => $restaurant->slug,
                'description' => $restaurant->description,
                'short_description' => $restaurant->short_description,
                'address' => $restaurant->address,
                'price_range' => $restaurant->price_range,
                'price_range_label' => PriceRange::label($restaurant->price_range),
                'avg_price_per_person' => $restaurant->avg_price_per_person !== null
                    ? (float) $restaurant->avg_price_per_person
                    : null,
                'avg_rating' => round((float) $restaurant->avg_rating, 1),
                'total_reviews' => (int) $restaurant->total_reviews,
                'phone' => $restaurant->phone,
                'district' => $restaurant->district?->name,
                'latitude' => $restaurant->latitude !== null ? (float) $restaurant->latitude : null,
                'longitude' => $restaurant->longitude !== null ? (float) $restaurant->longitude : null,
                'cuisines' => $cuisines->map(fn ($c) => [
                    'name' => $c->name,
                    'is_primary' => (bool) ($c->pivot->is_primary ?? false),
                ])->values()->all(),
                'images' => $restaurant->images->map(fn ($img) => [
                    'url' => PublicStorage::url($img->path),
                    'alt' => $img->alt_text,
                ])->values()->all(),
                'menu' => RestaurantMenuPresenter::forRestaurant($restaurant),
                'hours' => $hours->forSchedules($restaurant->schedules),
            ],
        ]);
    }
}
