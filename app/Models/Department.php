<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Department extends Model
{
    protected $fillable = ['name', 'code'];

    /** Provincias de este departamento */
    public function provinces(): HasMany
    {
        return $this->hasMany(Province::class);
    }

    /** Distritos de este departamento (a través de provincias) */
    public function districts(): HasManyThrough
    {
        return $this->hasManyThrough(District::class, Province::class);
    }
}
