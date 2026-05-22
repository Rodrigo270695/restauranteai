<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Restaurant extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'owner_id', 'district_id', 'cuisine_type_id', 'ambiance_id',
        'name', 'slug', 'description', 'short_description', 'address',
        'latitude', 'longitude', 'phone', 'whatsapp', 'email', 'website',
        'price_range', 'avg_price_per_person', 'capacity', 'cover_image',
        'avg_rating', 'total_reviews', 'total_views',
        'is_active', 'is_verified', 'is_featured', 'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_verified' => 'boolean',
            'is_featured' => 'boolean',
            'verified_at' => 'datetime',
            'avg_rating' => 'decimal:2',
            'avg_price_per_person' => 'decimal:2',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected static function booted(): void
    {
        static::saving(function (Restaurant $model) {
            if (empty($model->slug)) {
                $model->slug = Str::slug($model->name);
            }
        });
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class);
    }

    public function cuisineType(): BelongsTo
    {
        return $this->belongsTo(CuisineType::class);
    }

    public function cuisineTypes(): BelongsToMany
    {
        return $this->belongsToMany(CuisineType::class, 'restaurant_cuisine_type')
            ->withPivot('is_primary')
            ->withTimestamps()
            ->orderByPivot('is_primary', 'desc')
            ->orderBy('name');
    }

    public function ambiance(): BelongsTo
    {
        return $this->belongsTo(Ambiance::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(RestaurantImage::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(RestaurantSchedule::class);
    }

    public function dishes(): HasMany
    {
        return $this->hasMany(Dish::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function promotions(): HasMany
    {
        return $this->hasMany(Promotion::class);
    }

    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'restaurant_service');
    }

    public function languages(): BelongsToMany
    {
        return $this->belongsToMany(SupportLanguage::class, 'restaurant_language');
    }
}
