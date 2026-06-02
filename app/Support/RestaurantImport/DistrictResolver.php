<?php

namespace App\Support\RestaurantImport;

use App\Models\District;
use Illuminate\Support\Str;

final class DistrictResolver
{
    /** @var array<string, string> slug => district name in DB */
    private const ALIASES = [
        'distrito de picsi' => 'Picsi',
        'picsi' => 'Picsi',
        'illimo' => 'Illimo',
        'etén' => 'Eten',
        'eten' => 'Eten',
        'eten puerto' => 'Eten Puerto',
        'jose leonardo ortiz' => 'José Leonardo Ortiz',
        'monsefu' => 'Monsefú',
        'ferrenafe' => 'Ferreñafe',
        'la victoria' => 'La Victoria',
        'pimentel' => 'Pimentel',
        'lambayeque' => 'Lambayeque',
        'chiclayo' => 'Chiclayo',
        'tucume' => 'Túcume',
        'mochumi' => 'Mochumi',
        'motupe' => 'Motupe',
        'jayanca' => 'Jayanca',
        'morrope' => 'Mórrope',
        'cayalti' => 'Cayaltí',
        'saña' => 'Saña',
        'zaná' => 'Zaña',
        'sana' => 'Saña',
        'zana' => 'Zaña',
        'b' => 'Chiclayo',
        'cruz del medano' => 'Pimentel',
        'guadalupe' => 'Monsefú',
        'jequetepeque' => 'Pacora',
    ];

    public function resolve(?string $distrito, ?string $provincia = null, ?string $ubicacion = null): ?District
    {
        $candidates = array_filter([
            $distrito,
            $ubicacion,
            $provincia,
        ], fn ($v) => is_string($v) && trim($v) !== '');

        foreach ($candidates as $raw) {
            $district = $this->findByName($raw);
            if ($district) {
                return $district;
            }
        }

        return null;
    }

    private function findByName(string $raw): ?District
    {
        $trimmed = trim($raw);
        if ($trimmed === '') {
            return null;
        }

        $aliasName = self::ALIASES[$this->slugKey($trimmed)] ?? null;
        if ($aliasName) {
            $district = District::query()->where('name', $aliasName)->first();
            if ($district) {
                return $district;
            }
        }

        $district = District::query()->where('name', $trimmed)->first();
        if ($district) {
            return $district;
        }

        return District::query()
            ->get()
            ->first(fn (District $d) => strcasecmp($d->name, $trimmed) === 0
                || str($d->name)->ascii()->lower()->toString() === str($trimmed)->ascii()->lower()->toString());
    }

    private function slugKey(string $value): string
    {
        return str($value)->ascii()->lower()->trim()->toString();
    }
}
