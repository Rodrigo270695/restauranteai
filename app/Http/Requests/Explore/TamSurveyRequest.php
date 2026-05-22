<?php

namespace App\Http\Requests\Explore;

use Illuminate\Foundation\Http\FormRequest;

class TamSurveyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('tourist') ?? false;
    }

    public function rules(): array
    {
        $likert = ['required', 'integer', 'min:1', 'max:5'];

        return [
            'pu1_useful' => $likert,
            'pu2_faster' => $likert,
            'pu3_productivity' => $likert,
            'pu4_effectiveness' => $likert,
            'peou1_easy_to_learn' => $likert,
            'peou2_controllable' => $likert,
            'peou3_clear_understandable' => $likert,
            'peou4_easy_to_use' => $likert,
            'bi1_intend_to_use' => $likert,
            'bi2_recommend' => $likert,
            'open_comment' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
