<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements \Illuminate\Contracts\Auth\MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable, HasRoles;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function socialAccounts(): HasMany
    {
        return $this->hasMany(SocialAccount::class);
    }

    public function restaurantProfile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(RestaurantProfile::class);
    }

    public function touristProfile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(TouristProfile::class);
    }

    public function userPreferences(): HasMany
    {
        return $this->hasMany(UserPreference::class);
    }

    public function tamSurvey(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(TamSurvey::class);
    }

    public function touristRoutes(): HasMany
    {
        return $this->hasMany(TouristRoute::class);
    }

    public function favoriteRoutes(): BelongsToMany
    {
        return $this->belongsToMany(TouristRoute::class, 'tourist_route_favorites')
            ->withTimestamps();
    }

    public function restaurants(): HasMany
    {
        return $this->hasMany(Restaurant::class, 'owner_id');
    }

    /**
     * Turistas y dueños no usan verificación de correo; el acceso de dueños lo controla la aprobación del negocio.
     */
    public function hasVerifiedEmail(): bool
    {
        if ($this->hasRole('tourist') || $this->hasRole('restaurant_owner')) {
            return true;
        }

        return $this->email_verified_at !== null;
    }

    public function sendEmailVerificationNotification(): void
    {
        if ($this->hasRole('tourist') || $this->hasRole('restaurant_owner')) {
            return;
        }

        $this->notify(new \Illuminate\Auth\Notifications\VerifyEmail);
    }
}
