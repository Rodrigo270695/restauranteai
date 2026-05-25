<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MlTrainingRun extends Model
{
    protected $fillable = [
        'status',
        'message',
        'started_at',
        'finished_at',
        'duration_seconds',
        'result',
        'triggered_by_user_id',
        'triggered_by_name',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'result' => 'array',
        ];
    }

    public function triggeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'triggered_by_user_id');
    }
}
