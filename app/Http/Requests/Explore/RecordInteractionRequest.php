<?php

namespace App\Http\Requests\Explore;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecordInteractionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('tourist') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'interaction_type' => [
                'required',
                'string',
                Rule::in(['save', 'unsave', 'click']),
            ],
        ];
    }
}
