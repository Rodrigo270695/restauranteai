<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactInquiry extends Model
{
    public const TYPE_INTEGRATE = 'integrate_restaurant';

    public const TYPE_APPROVAL = 'approval_help';

    public const TYPE_GENERAL = 'general';

    protected $fillable = [
        'user_id',
        'type',
        'name',
        'email',
        'phone',
        'restaurant_name',
        'district',
        'message',
        'status',
        'locale',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function typeLabel(): string
    {
        return match ($this->type) {
            self::TYPE_INTEGRATE => 'Integrar restaurante',
            self::TYPE_APPROVAL => 'Ayuda con aprobación',
            default => 'Consulta general',
        };
    }
}
