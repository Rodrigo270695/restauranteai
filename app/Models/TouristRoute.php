<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class TouristRoute extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'description',
        'status',
        'route_date',
        'completed_at',
        'stops_count',
        'total_distance_km',
        'estimated_minutes',
        'path_coordinates',
    ];

    protected function casts(): array
    {
        return [
            'route_date' => 'date',
            'completed_at' => 'datetime',
            'stops_count' => 'integer',
            'total_distance_km' => 'decimal:2',
            'estimated_minutes' => 'integer',
            'path_coordinates' => 'array',
        ];
    }

    public function isCompleted(): bool
    {
        return $this->completed_at !== null;
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected static function booted(): void
    {
        static::creating(function (TouristRoute $route) {
            if (empty($route->slug)) {
                $route->slug = Str::slug($route->name.'-'.Str::random(4));
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function stops(): HasMany
    {
        return $this->hasMany(TouristRouteStop::class)->orderBy('position');
    }
}
