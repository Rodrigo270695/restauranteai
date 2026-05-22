<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantImage extends Model
{
    protected $fillable = [
        'restaurant_id', 'path', 'alt_text', 'type', 'display_order', 'is_cover',
    ];

    protected function casts(): array
    {
        return [
            'is_cover' => 'boolean',
            'display_order' => 'integer',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
