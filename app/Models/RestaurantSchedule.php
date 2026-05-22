<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantSchedule extends Model
{
    protected $fillable = [
        'restaurant_id', 'day_of_week', 'opens_at', 'closes_at', 'is_closed',
    ];

    protected function casts(): array
    {
        return ['is_closed' => 'boolean', 'day_of_week' => 'integer'];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
