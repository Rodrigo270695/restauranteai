<?php

namespace App\Support;

use App\Models\Restaurant;
use App\Models\Review;

final class RestaurantReviewsPresenter
{
    /** @return array{distribution: array<int, int>, items: list<array<string, mixed>>} */
    public function forRestaurant(Restaurant $restaurant, int $limit = 15): array
    {
        $base = Review::query()
            ->where('restaurant_id', $restaurant->id)
            ->where('is_visible', true);

        $distribution = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];

        foreach ($base->clone()->selectRaw('rating, COUNT(*) as total')->groupBy('rating')->pluck('total', 'rating') as $rating => $total) {
            $star = (int) $rating;
            if ($star >= 1 && $star <= 5) {
                $distribution[$star] = (int) $total;
            }
        }

        $items = $base->clone()
            ->with('user:id,name')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (Review $review) => [
                'id' => $review->id,
                'rating' => (int) $review->rating,
                'comment' => $review->comment,
                'author' => $this->publicAuthorName($review->user?->name),
                'created_at' => PeruDateTime::toClientIso($review->created_at),
                'owner_response' => $review->owner_response,
                'owner_responded_at' => PeruDateTime::toClientIso($review->owner_responded_at),
            ])
            ->values()
            ->all();

        return [
            'distribution' => $distribution,
            'items' => $items,
        ];
    }

    private function publicAuthorName(?string $name): string
    {
        if ($name === null || trim($name) === '') {
            return 'Turista';
        }

        $parts = preg_split('/\s+/u', trim($name)) ?: [];

        if (count($parts) === 1) {
            return $parts[0];
        }

        $last = $parts[array_key_last($parts)];

        return $parts[0].' '.mb_strtoupper(mb_substr($last, 0, 1)).'.';
    }
}
