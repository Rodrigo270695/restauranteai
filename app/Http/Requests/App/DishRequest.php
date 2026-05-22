<?php

namespace App\Http\Requests\App;

use Illuminate\Foundation\Http\FormRequest;

class DishRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage_dishes') ?? false;
    }

    public function rules(): array
    {
        $isStore = $this->isMethod('post');

        return [
            'name' => [$isStore ? 'required' : 'sometimes', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'price' => [$isStore ? 'required' : 'sometimes', 'numeric', 'min:0'],
            'dish_category_id' => ['nullable', 'exists:dish_categories,id'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'is_available' => ['sometimes', 'boolean'],
            'is_signature' => ['sometimes', 'boolean'],
            'display_order' => ['nullable', 'integer', 'min:0', 'max:255'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_available')) {
            $this->merge(['is_available' => $this->boolean('is_available')]);
        }
        if ($this->has('is_signature')) {
            $this->merge(['is_signature' => $this->boolean('is_signature')]);
        }
    }
}
