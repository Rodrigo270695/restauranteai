<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TouristRouteStop extends Model
{
    protected $fillable = [
        'tourist_route_id',
        'restaurant_id',
        'position',
        'note',
    ];

    public function route(): BelongsTo
    {
        return $this->belongsTo(TouristRoute::class, 'tourist_route_id');
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
