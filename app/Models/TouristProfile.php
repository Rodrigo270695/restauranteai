<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TouristProfile extends Model
{
    protected $fillable = [
        'user_id',
        'avatar_url',
        'bio',
        'city',
        'birth_date',
        'preferred_cuisines',
        'budget_preference',
        'completed_at',
    ];

    protected $casts = [
        'preferred_cuisines' => 'array',
        'birth_date'         => 'date',
        'completed_at'       => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isCompleted(): bool
    {
        return $this->completed_at !== null;
    }
}
