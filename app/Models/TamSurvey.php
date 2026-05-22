<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TamSurvey extends Model
{
    protected $table = 'tam_surveys';

    protected $fillable = [
        'user_id',
        'pu1_useful',
        'pu2_faster',
        'pu3_productivity',
        'pu4_effectiveness',
        'peou1_easy_to_learn',
        'peou2_controllable',
        'peou3_clear_understandable',
        'peou4_easy_to_use',
        'bi1_intend_to_use',
        'bi2_recommend',
        'open_comment',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
