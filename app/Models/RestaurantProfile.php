<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class RestaurantProfile extends Model
{
    use SoftDeletes;

    protected static function booted(): void
    {
        static::updated(function (RestaurantProfile $profile): void {
            if (! $profile->wasChanged('status') || $profile->status !== 'approved') {
                return;
            }
            if ($profile->post_approval_completed_at !== null) {
                return;
            }
            if (! $profile->isProfileComplete()) {
                return;
            }

            self::query()->whereKey($profile->id)->whereNull('post_approval_completed_at')->update([
                'post_approval_completed_at' => now(),
            ]);
        });
    }

    protected $fillable = [
        'user_id',
        'business_name',
        'ruc',
        'phone',
        'address',
        'city',
        'district',
        'description',
        'website',
        'status',
        'rejection_reason',
        'approved_at',
        'approved_by',
        'post_approval_completed_at',
    ];

    protected $casts = [
        'approved_at'                => 'datetime',
        'post_approval_completed_at' => 'datetime',
    ];

    // ── Relaciones ────────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // ── Helpers de estado ─────────────────────────────────────────────────────

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    /** Tras aprobación: debe completar datos en Configuración una sola vez. */
    public function needsPostApprovalOnboarding(): bool
    {
        return $this->isApproved() && $this->post_approval_completed_at === null;
    }

    /**
     * Perfil de restaurante listo para operar en el panel (solo debe pedirse una vez).
     * Cuenta como completo si hay descripción, o si ya guardó ubicación y contacto desde Configuración.
     */
    public function isProfileComplete(): bool
    {
        $description = trim((string) ($this->description ?? ''));
        if ($description !== '') {
            return true;
        }

        $address = trim((string) ($this->address ?? ''));
        $phone = trim((string) ($this->phone ?? ''));

        return $address !== '' && $phone !== '';
    }
}
