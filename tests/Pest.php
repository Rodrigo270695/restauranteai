<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind different classes or traits.
|
*/

pest()->extend(TestCase::class)
 // ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function basicGeoDistrict(): \App\Models\District
{
    $dept = \App\Models\Department::firstOrCreate(['code' => '14'], ['name' => 'Lambayeque']);
    $prov = \App\Models\Province::firstOrCreate(
        ['code' => '1401'],
        ['name' => 'Chiclayo', 'department_id' => $dept->id],
    );

    return \App\Models\District::firstOrCreate(
        ['code' => '140101'],
        ['name' => 'Chiclayo', 'province_id' => $prov->id],
    );
}

function restaurantUpdatePayload(\App\Models\Restaurant $restaurant, array $overrides = []): array
{
    return array_merge([
        'name' => $restaurant->name,
        'price_range' => $restaurant->price_range ?? 'moderado',
        'address' => $restaurant->address ?? 'Av. Test 100',
        'latitude' => $restaurant->latitude ?? -6.77137,
        'longitude' => $restaurant->longitude ?? -79.84088,
        'district_id' => $restaurant->district_id,
    ], $overrides);
}
