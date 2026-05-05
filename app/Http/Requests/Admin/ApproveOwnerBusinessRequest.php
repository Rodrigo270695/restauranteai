<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ApproveOwnerBusinessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('owners.approve_business') ?? false;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [];
    }
}
