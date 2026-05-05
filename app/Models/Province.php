<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Province extends Model
{
    protected $fillable = ['department_id', 'name', 'code'];

    /** Departamento al que pertenece */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /** Distritos de esta provincia */
    public function districts(): HasMany
    {
        return $this->hasMany(District::class);
    }
}
