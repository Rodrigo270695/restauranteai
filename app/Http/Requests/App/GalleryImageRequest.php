<?php

namespace App\Http\Requests\App;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GalleryImageRequest extends FormRequest
{
    /** Tipos de la galería del local (no incluye platos: eso va en la carta). */
    public const GALLERY_TYPES = ['exterior', 'interior', 'ambiente'];

    public function authorize(): bool
    {
        return $this->user()?->can('manage_gallery') ?? false;
    }

    public function rules(): array
    {
        $isStore = $this->isMethod('post');

        return [
            'image' => [$isStore ? 'required' : 'sometimes', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'alt_text' => ['nullable', 'string', 'max:150'],
            'type' => [$isStore ? 'required' : 'sometimes', Rule::in(self::GALLERY_TYPES)],
            'display_order' => ['nullable', 'integer', 'min:0', 'max:255'],
            'is_cover' => ['sometimes', 'boolean'],
        ];
    }
}
