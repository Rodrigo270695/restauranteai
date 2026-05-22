<?php

namespace App\Http\Requests\App;

use Illuminate\Foundation\Http\FormRequest;

class SyncSchedulesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage_schedules') ?? false;
    }

    public function rules(): array
    {
        return [
            'schedules' => ['required', 'array', 'size:7'],
            'schedules.*.day_of_week' => ['required', 'integer', 'between:0,6'],
            'schedules.*.is_closed' => ['required', 'boolean'],
            'schedules.*.opens_at' => ['nullable', 'date_format:H:i'],
            'schedules.*.closes_at' => ['nullable', 'date_format:H:i'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            foreach ($this->input('schedules', []) as $i => $row) {
                if (! empty($row['is_closed'])) {
                    continue;
                }
                if (empty($row['opens_at']) || empty($row['closes_at'])) {
                    $validator->errors()->add(
                        "schedules.{$i}.opens_at",
                        'Indica hora de apertura y cierre o marca el día como cerrado.',
                    );
                } elseif ($row['opens_at'] >= $row['closes_at']) {
                    $validator->errors()->add(
                        "schedules.{$i}.closes_at",
                        'La hora de cierre debe ser posterior a la de apertura.',
                    );
                }
            }
        });
    }
}
