<?php

namespace App\Http\Requests\App;

use Illuminate\Foundation\Http\FormRequest;

class ReviewResponseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('reviews.view') ?? false;
    }

    public function rules(): array
    {
        return [
            'owner_response' => ['required', 'string', 'max:2000'],
        ];
    }
}
