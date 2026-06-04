<?php

namespace App\Support;

final class PriceRange
{
    public const ECONOMICO = 'economico';

    public const MODERADO = 'moderado';

    public const CARO = 'caro';

    /** @var list<string> */
    public const VALUES = [self::ECONOMICO, self::MODERADO, self::CARO];

    public const ECONOMICO_MAX = 30.0;

    public const MODERADO_MIN = 30.0;

    public const MODERADO_MAX = 80.0;

    public const CARO_MIN = 80.0;

    public static function label(?string $value): ?string
    {
        return match ($value) {
            self::ECONOMICO => 'Económico',
            self::MODERADO => 'Moderado',
            self::CARO, 'premium' => 'Caro',
            default => $value,
        };
    }

    public static function validationRule(): string
    {
        return 'in:'.implode(',', self::VALUES);
    }

    public static function avgPrice(?string $value): float
    {
        return match ($value) {
            self::ECONOMICO => 25.0,
            self::CARO, 'premium' => 85.0,
            default => 45.0,
        };
    }

    /**
     * @return list<array{value: string, label: string, name: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (string $value) => [
                'value' => $value,
                'label' => self::label($value),
                'name' => self::label($value),
            ],
            self::VALUES,
        );
    }

    public static function normalize(?string $raw): string
    {
        $value = str($raw ?? '')->ascii()->lower()->trim()->toString();

        if ($value === '') {
            return self::MODERADO;
        }

        if (str_contains($value, 'econ') || $value === 'bajo' || $value === '1') {
            return self::ECONOMICO;
        }

        if (str_contains($value, 'car') || str_contains($value, 'prem') || str_contains($value, 'alto') || $value === '3') {
            return self::CARO;
        }

        if (in_array($value, self::VALUES, true) || $value === 'premium') {
            return $value === 'premium' ? self::CARO : $value;
        }

        return self::MODERADO;
    }

    public static function avgPriceError(?string $range, mixed $avg): ?string
    {
        if ($avg === null || $avg === '') {
            return null;
        }

        $amount = (float) $avg;
        $range = self::normalize(is_string($range) ? $range : null);

        return match ($range) {
            self::ECONOMICO => $amount >= self::ECONOMICO_MAX
                ? 'El precio promedio para rango Económico debe ser menor a S/ 30.'
                : null,
            self::MODERADO => $amount < self::MODERADO_MIN || $amount > self::MODERADO_MAX
                ? 'El precio promedio para rango Moderado debe estar entre S/ 30 y S/ 80.'
                : null,
            self::CARO => $amount <= self::CARO_MIN
                ? 'El precio promedio para rango Caro debe ser mayor a S/ 80.'
                : null,
            default => null,
        };
    }
}
