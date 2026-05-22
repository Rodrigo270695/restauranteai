<?php

namespace App\Http\Requests\App;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PromotionRequest extends FormRequest
{
    public const TYPES = ['descuento', 'evento', 'menu_especial', '2x1', 'otro'];

    public function authorize(): bool
    {
        return $this->user()?->can('manage_promotions') ?? false;
    }

    public function rules(): array
    {
        $isStore = $this->isMethod('post');

        return [
            'title' => [$isStore ? 'required' : 'sometimes', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'type' => [$isStore ? 'required' : 'sometimes', Rule::in(self::TYPES)],
            'discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'starts_at' => [$isStore ? 'required' : 'sometimes', 'date'],
            'ends_at' => [$isStore ? 'required' : 'sometimes', 'date', 'after:starts_at'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_active')) {
            $this->merge(['is_active' => $this->boolean('is_active')]);
        }
        if ($this->input('discount_percent') === '' || $this->input('discount_percent') === null) {
            $this->merge(['discount_percent' => null]);
        }
    }
}
