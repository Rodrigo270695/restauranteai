<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantReservation extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_VISITED = 'visited';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'user_id',
        'restaurant_id',
        'tourist_route_id',
        'tourist_route_stop_id',
        'reserved_for',
        'party_size',
        'status',
        'confirmed_at',
        'visited_at',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'reserved_for' => 'datetime',
            'confirmed_at' => 'datetime',
            'visited_at' => 'datetime',
            'party_size' => 'integer',
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

    public function touristRoute(): BelongsTo
    {
        return $this->belongsTo(TouristRoute::class);
    }

    public function touristRouteStop(): BelongsTo
    {
        return $this->belongsTo(TouristRouteStop::class);
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isConfirmed(): bool
    {
        return $this->status === self::STATUS_CONFIRMED;
    }

    public function isVisited(): bool
    {
        return $this->status === self::STATUS_VISITED;
    }
}
