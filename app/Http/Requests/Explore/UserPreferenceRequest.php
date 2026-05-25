<?php

namespace App\Http\Requests\Explore;

use App\Models\CuisineType;
use App\Models\District;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserPreferenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('tourist') ?? false;
    }

    public function rules(): array
    {
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
            'budget_preference' => ['nullable', Rule::in(['low', 'medium', 'high'])],
            'preferred_cuisines' => ['nullable', 'array'],
            'preferred_cuisines.*' => ['string', Rule::in($cuisineSlugs)],
            'cuisine_type_id' => ['nullable', 'exists:cuisine_types,id'],
            'ambiance_id' => ['nullable', 'exists:ambiances,id'],
            'price_range' => ['nullable', Rule::in(['economico', 'moderado', 'premium'])],
            'max_distance_km' => ['nullable', 'numeric', 'min:0.5', 'max:200'],
            'party_type_ids' => ['nullable', 'array'],
            'party_type_ids.*' => ['integer', Rule::exists('party_types', 'id')->where('is_active', true)],
            'dietary_option_ids' => ['nullable', 'array'],
            'dietary_option_ids.*' => ['integer', Rule::exists('dietary_options', 'id')->where('is_active', true)->where('for_tourist_preference', true)],
            'restaurant_environment_ids' => ['nullable', 'array'],
            'restaurant_environment_ids.*' => ['integer', Rule::exists('restaurant_environments', 'id')->where('is_active', true)],
            'recommended_moment_ids' => ['nullable', 'array'],
            'recommended_moment_ids.*' => ['integer', Rule::exists('recommended_moments', 'id')->where('is_active', true)],
            'service_ids' => ['nullable', 'array'],
            'service_ids.*' => ['integer', Rule::exists('services', 'id')->where('is_active', true)],
            'language_ids' => ['nullable', 'array'],
            'language_ids.*' => ['integer', Rule::exists('support_languages', 'id')->where('is_active', true)],
            'min_rating' => ['nullable', 'numeric', 'min:3', 'max:5'],
        ];
    }
}
