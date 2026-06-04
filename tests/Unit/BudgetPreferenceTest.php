<?php

use App\Support\BudgetPreference;

test('budget preference normalizes legacy single values', function () {
    expect(BudgetPreference::normalize('medium'))->toBe(['medium']);
    expect(BudgetPreference::normalize(['low', 'high']))->toBe(['low', 'high']);
});

test('budget preference maps to multiple price ranges', function () {
    expect(BudgetPreference::toPriceRanges(['medium', 'high']))->toBe(['moderado', 'caro']);
    expect(BudgetPreference::singlePriceRange(['medium', 'high']))->toBeNull();
    expect(BudgetPreference::singlePriceRange(['low']))->toBe('economico');
});
