<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CatalogItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        $catalog = $this->route('catalog');
        $action = $this->route()->getActionMethod();

        $permission = match ($action) {
            'store' => "{$catalog}.create",
            'update' => "{$catalog}.edit",
            'destroy' => "{$catalog}.delete",
            default => "{$catalog}.view",
        };

        return $this->user()?->can($permission) ?? false;
    }

    public function rules(): array
    {
        $catalog = $this->route('catalog');
        $id = $this->route('item');

        return match ($catalog) {
            'languages' => [
                'name' => ['required', 'string', 'max:60'],
                'code' => ['required', 'string', 'max:10', Rule::unique('support_languages', 'code')->ignore($id)],
                'is_active' => ['sometimes', 'boolean'],
            ],
            'dish_categories' => [
                'name' => ['required', 'string', 'max:80'],
                'slug' => ['nullable', 'string', 'max:80', Rule::unique('dish_categories', 'slug')->ignore($id)],
                'display_order' => ['nullable', 'integer', 'min:0', 'max:255'],
                'is_active' => ['sometimes', 'boolean'],
            ],
            default => [
                'name' => ['required', 'string', 'max:80'],
                'slug' => ['nullable', 'string', 'max:80', Rule::unique($catalog, 'slug')->ignore($id)],
                'description' => ['nullable', 'string'],
                'icon' => ['nullable', 'string', 'max:100'],
                'is_active' => ['sometimes', 'boolean'],
            ],
        };
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_active')) {
            $this->merge(['is_active' => $this->boolean('is_active')]);
        }
    }
}
