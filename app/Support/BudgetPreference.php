<?php

namespace App\Support;

final class BudgetPreference
{
    public const LOW = 'low';

    public const MEDIUM = 'medium';

    public const HIGH = 'high';

    /** @var list<string> */
    public const VALUES = [self::LOW, self::MEDIUM, self::HIGH];

    /** @return list<string> */
    public static function normalize(mixed $value): array
    {
        if ($value === null || $value === '') {
            return [];
        }

        if (is_string($value)) {
            return in_array($value, self::VALUES, true) ? [$value] : [];
        }

        if (! is_array($value)) {
            return [];
        }

        return array_values(array_unique(array_filter(
            $value,
            fn ($item) => is_string($item) && in_array($item, self::VALUES, true),
        )));
    }

    /** @return list<string> */
    public static function toPriceRanges(mixed $budgets): array
    {
        return array_values(array_unique(array_filter(array_map(
            fn (string $budget) => match ($budget) {
                self::LOW => PriceRange::ECONOMICO,
                self::MEDIUM => PriceRange::MODERADO,
                self::HIGH => PriceRange::CARO,
                default => null,
            },
            self::normalize($budgets),
        ))));
    }

    public static function singlePriceRange(mixed $budgets): ?string
    {
        $ranges = self::toPriceRanges($budgets);

        return count($ranges) === 1 ? $ranges[0] : null;
    }
}
