<?php

namespace App\Http\Requests;

use App\Models\CuisineType;
use App\Models\District;
use App\Support\BudgetPreference;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TouristProfileSetupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('tourist') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $budget = $this->input('budget_preference');

        if (is_string($budget) && $budget !== '') {
            $this->merge(['budget_preference' => [$budget]]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        if ($this->boolean('skip')) {
            return ['skip' => ['sometimes', 'boolean']];
        }

        $cuisineSlugs = CuisineType::query()
            ->where('is_active', true)
            ->pluck('slug')
            ->all();

        $districtNames = District::query()
            ->whereHas('province.department', fn ($q) => $q->where('code', '14'))
            ->pluck('name')
            ->all();

        return [
            'city' => ['nullable', 'string', 'max:100', Rule::in($districtNames)],
            'bio' => ['nullable', 'string', 'max:500'],
            'budget_preference' => ['nullable', 'array'],
            'budget_preference.*' => ['string', Rule::in(BudgetPreference::VALUES)],
            'preferred_cuisines' => ['nullable', 'array'],
            'preferred_cuisines.*' => ['string', Rule::in($cuisineSlugs)],
        ];
    }
}
