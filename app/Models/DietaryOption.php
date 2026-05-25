<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class DietaryOption extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'for_tourist_preference',
        'for_restaurant',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'for_tourist_preference' => 'boolean',
            'for_restaurant' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (DietaryOption $model) {
            if (empty($model->slug)) {
                $model->slug = Str::slug($model->name);
            }
        });
    }

    public function restaurants(): BelongsToMany
    {
        return $this->belongsToMany(Restaurant::class, 'restaurant_dietary_option');
    }
}
