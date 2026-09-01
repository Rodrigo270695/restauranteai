<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TouristRouteFavorite extends Model
{
    protected $fillable = ['user_id', 'tourist_route_id'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function route(): BelongsTo
    {
        return $this->belongsTo(TouristRoute::class, 'tourist_route_id');
    }
}
