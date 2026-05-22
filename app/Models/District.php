<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class District extends Model
{
    protected $fillable = ['province_id', 'name', 'code'];

    /** Provincia a la que pertenece */
    public function province(): BelongsTo
    {
        return $this->belongsTo(Province::class);
    }

    public function restaurants(): HasMany
    {
        return $this->hasMany(Restaurant::class);
    }

    /** Departamento al que pertenece (a través de la provincia) */
    public function department(): \Illuminate\Database\Eloquent\Relations\HasOneThrough
    {
        return $this->hasOneThrough(
            Department::class,
            Province::class,
            'id',            // FK en provinces
            'id',            // FK en departments
            'province_id',   // llave local en districts
            'department_id', // llave en provinces
        );
    }
}
