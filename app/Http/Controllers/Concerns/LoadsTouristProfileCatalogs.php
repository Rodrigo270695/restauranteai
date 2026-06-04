<?php

namespace App\Http\Controllers\Concerns;

use App\Models\CuisineType;
use App\Models\DietaryOption;
use App\Models\District;
use App\Models\PartyType;
use App\Models\RecommendedMoment;
use App\Models\RestaurantEnvironment;
use App\Models\Service;
use App\Models\SupportLanguage;
use App\Services\RestaurantExploreService;

trait LoadsTouristProfileCatalogs
{
    /** @return list<array{id: int, name: string, slug: string}> */
    protected function activeCuisineTypes(): array
    {
        return CuisineType::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (CuisineType $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
            ])
            ->values()
            ->all();
    }

    /** @return list<array{id: int, name: string, province: string}> */
    protected function lambayequeDistricts(): array
    {
        return District::query()
            ->with('province:id,name')
            ->whereHas('province.department', fn ($q) => $q->where('code', '14'))
            ->orderBy('name')
            ->get(['id', 'name', 'province_id'])
            ->map(fn (District $d) => [
                'id' => $d->id,
                'name' => $d->name,
                'province' => $d->province->name,
            ])
            ->values()
            ->all();
    }

    /** @return list<array{key: string, price_range: string}> */
    protected function budgetOptions(): array
    {
        return [
            ['key' => 'low', 'price_range' => 'economico'],
            ['key' => 'medium', 'price_range' => 'moderado'],
            ['key' => 'high', 'price_range' => 'caro'],
        ];
    }

    /** @return list<array{id: int, name: string, slug: string}> */
    protected function activeServices(): array
    {
        return Service::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (Service $s) => [
                'id' => $s->id,
                'name' => $s->name,
                'slug' => $s->slug,
            ])
            ->values()
            ->all();
    }

    /** @return list<array{id: int, name: string, slug: string}> */
    protected function activePartyTypes(): array
    {
        return PartyType::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (PartyType $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
            ])
            ->values()
            ->all();
    }

    /** @return list<array{id: int, name: string, slug: string}> */
    protected function activeDietaryOptionsForTourist(): array
    {
        return DietaryOption::query()
            ->where('is_active', true)
            ->where('for_tourist_preference', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (DietaryOption $d) => [
                'id' => $d->id,
                'name' => $d->name,
                'slug' => $d->slug,
            ])
            ->values()
            ->all();
    }

    /** @return list<array{id: int, name: string, slug: string}> */
    protected function activeDietaryOptionsForRestaurant(): array
    {
        return DietaryOption::query()
            ->where('is_active', true)
            ->where('for_restaurant', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (DietaryOption $d) => [
                'id' => $d->id,
                'name' => $d->name,
                'slug' => $d->slug,
            ])
            ->values()
            ->all();
    }

    /** @return list<array{id: int, name: string, slug: string}> */
    protected function activeRestaurantEnvironments(): array
    {
        return RestaurantEnvironment::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (RestaurantEnvironment $e) => [
                'id' => $e->id,
                'name' => $e->name,
                'slug' => $e->slug,
            ])
            ->values()
            ->all();
    }

    /** @return list<array{id: int, name: string, slug: string}> */
    protected function activeRecommendedMoments(): array
    {
        return RecommendedMoment::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (RecommendedMoment $m) => [
                'id' => $m->id,
                'name' => $m->name,
                'slug' => $m->slug,
            ])
            ->values()
            ->all();
    }

    /** @return list<array{id: int, name: string, code: string}> */
    protected function activeSupportLanguages(): array
    {
        return SupportLanguage::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(fn (SupportLanguage $l) => [
                'id' => $l->id,
                'name' => $l->name,
                'code' => $l->code,
            ])
            ->values()
            ->all();
    }

    /** @return list<array{value: string, label: string, name: string}> */
    protected function catalogPriceRanges(RestaurantExploreService $explore): array
    {
        return $explore->availablePriceRanges();
    }

    /**
     * @param  list<string>  $values
     * @return list<string>
     */
    protected function normalizePreferredCuisineSlugs(array $values): array
    {
        if ($values === []) {
            return [];
        }

        $bySlug = CuisineType::query()
            ->where('is_active', true)
            ->whereIn('slug', $values)
            ->pluck('slug')
            ->all();

        $byName = CuisineType::query()
            ->where('is_active', true)
            ->whereIn('name', $values)
            ->pluck('slug')
            ->all();

        return array_values(array_unique([...$bySlug, ...$byName]));
    }
}
