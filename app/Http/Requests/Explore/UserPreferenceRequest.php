<?php

namespace App\Http\Requests\Explore;

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
        return [
            'city' => ['nullable', 'string', 'max:100'],
            'bio' => ['nullable', 'string', 'max:500'],
            'budget_preference' => ['nullable', 'in:low,medium,high'],
            'preferred_cuisines' => ['nullable', 'array'],
            'preferred_cuisines.*' => ['string', 'max:50'],
            'cuisine_type_id' => ['nullable', 'exists:cuisine_types,id'],
            'ambiance_id' => ['nullable', 'exists:ambiances,id'],
            'price_range' => ['nullable', Rule::in(['economico', 'moderado', 'premium'])],
            'max_distance_km' => ['nullable', 'numeric', 'min:0.5', 'max:200'],
            'party_type' => ['nullable', Rule::in(['solo', 'pareja', 'familia', 'amigos', 'negocios'])],
            'dietary_restriction' => ['nullable', Rule::in(['ninguna', 'vegetariano', 'vegano', 'sin_gluten', 'halal'])],
        ];
    }
}
