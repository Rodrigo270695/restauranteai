<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    protected $fillable = [
        'user_id', 'restaurant_id', 'rating', 'comment', 'is_visible',
        'owner_response', 'owner_responded_at',
    ];

    protected function casts(): array
    {
        return [
            'is_visible' => 'boolean',
            'owner_responded_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
