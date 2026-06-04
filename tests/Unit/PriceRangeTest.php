<?php

use App\Support\PriceRange;

test('avg price validation matches budget tiers', function () {
    expect(PriceRange::avgPriceError(PriceRange::ECONOMICO, 29.99))->toBeNull();
    expect(PriceRange::avgPriceError(PriceRange::ECONOMICO, 30))->toContain('Económico');

    expect(PriceRange::avgPriceError(PriceRange::MODERADO, 30))->toBeNull();
    expect(PriceRange::avgPriceError(PriceRange::MODERADO, 80))->toBeNull();
    expect(PriceRange::avgPriceError(PriceRange::MODERADO, 29.99))->toContain('Moderado');
    expect(PriceRange::avgPriceError(PriceRange::MODERADO, 80.01))->toContain('Moderado');

    expect(PriceRange::avgPriceError(PriceRange::CARO, 80.01))->toBeNull();
    expect(PriceRange::avgPriceError(PriceRange::CARO, 80))->toContain('Caro');
});

test('avg price validation ignores empty values', function () {
    expect(PriceRange::avgPriceError(PriceRange::MODERADO, null))->toBeNull();
    expect(PriceRange::avgPriceError(PriceRange::MODERADO, ''))->toBeNull();
});
