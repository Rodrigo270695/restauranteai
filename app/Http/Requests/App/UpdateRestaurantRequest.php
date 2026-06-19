<?php

namespace App\Http\Requests\App;

use App\Support\PriceRange;
use Illuminate\Foundation\Http\FormRequest;

class UpdateRestaurantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage_own_restaurant') ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'short_description' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'address' => ['required', 'string', 'max:255'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'district_id' => ['required', 'integer', 'exists:districts,id'],
            'cuisine_type_ids' => ['nullable', 'array'],
            'cuisine_type_ids.*' => ['integer', 'exists:cuisine_types,id'],
            'primary_cuisine_type_id' => ['nullable', 'integer', 'exists:cuisine_types,id'],
            'ambiance_id' => ['nullable', 'exists:ambiances,id'],
            'party_type_ids' => ['nullable', 'array'],
            'party_type_ids.*' => ['integer', 'exists:party_types,id'],
            'dietary_option_ids' => ['nullable', 'array'],
            'dietary_option_ids.*' => ['integer', 'exists:dietary_options,id'],
            'restaurant_environment_ids' => ['nullable', 'array'],
            'restaurant_environment_ids.*' => ['integer', 'exists:restaurant_environments,id'],
            'recommended_moment_ids' => ['nullable', 'array'],
            'recommended_moment_ids.*' => ['integer', 'exists:recommended_moments,id'],
            'phone' => ['nullable', 'string', 'max:20'],
            'whatsapp' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:100'],
            'website' => ['nullable', 'string', 'max:255'],
            'price_range' => ['required', PriceRange::validationRule()],
            'avg_price_per_person' => ['nullable', 'numeric', 'min:0'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => 'El nombre del restaurante es obligatorio.',
            'district_id.required' => 'Selecciona departamento, provincia y distrito.',
            'district_id.exists' => 'El distrito seleccionado no es válido.',
            'address.required' => 'La dirección es obligatoria.',
            'latitude.required' => 'Marca la ubicación en el mapa (arrastra el pin o haz clic).',
            'longitude.required' => 'Marca la ubicación en el mapa (arrastra el pin o haz clic).',
            'price_range.required' => 'Selecciona un rango de precio.',
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'name' => 'nombre del restaurante',
            'district_id' => 'distrito',
            'address' => 'dirección',
            'latitude' => 'ubicación en el mapa',
            'longitude' => 'ubicación en el mapa',
            'price_range' => 'rango de precio',
        ];
    }

    protected function prepareForValidation(): void
    {
        $districtId = $this->input('district_id');
        $ambianceId = $this->input('ambiance_id');

        $this->merge([
            'district_id' => $districtId === '' || $districtId === null ? null : (int) $districtId,
            'ambiance_id' => $ambianceId === '' || $ambianceId === null ? null : (int) $ambianceId,
        ]);
    }
}
