<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPreference extends Model
{
    protected $fillable = [
        'user_id',
        'cuisine_type_id',
        'ambiance_id',
        'price_range',
        'max_distance_km',
        'party_type',
        'dietary_restriction',
    ];

    protected function casts(): array
    {
        return [
            'max_distance_km' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function cuisineType(): BelongsTo
    {
        return $this->belongsTo(CuisineType::class);
    }

    public function ambiance(): BelongsTo
    {
        return $this->belongsTo(Ambiance::class);
    }
}
