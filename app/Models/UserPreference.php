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
        'party_type_ids',
        'dietary_option_ids',
        'restaurant_environment_ids',
        'recommended_moment_ids',
        'service_ids',
        'language_ids',
        'min_rating',
    ];

    protected function casts(): array
    {
        return [
            'max_distance_km' => 'decimal:2',
            'party_type_ids' => 'array',
            'dietary_option_ids' => 'array',
            'restaurant_environment_ids' => 'array',
            'recommended_moment_ids' => 'array',
            'service_ids' => 'array',
            'language_ids' => 'array',
            'min_rating' => 'decimal:1',
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
