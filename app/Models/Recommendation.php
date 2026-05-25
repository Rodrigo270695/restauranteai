<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Recommendation extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'request_id', 'restaurant_id', 'rank', 'score', 'was_viewed', 'was_accepted',
    ];

    protected function casts(): array
    {
        return [
            'was_viewed' => 'boolean',
            'was_accepted' => 'boolean',
            'score' => 'decimal:6',
            'created_at' => 'datetime',
        ];
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(RecommendationRequest::class, 'request_id');
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
