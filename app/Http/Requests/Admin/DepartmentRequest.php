<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $action = $this->isMethod('post') ? 'geography.create' : 'geography.edit';
        return $this->user()?->can($action) ?? false;
    }

    public function rules(): array
    {
        $id = $this->route('department')?->id;

        return [
            'name' => ['required', 'string', 'max:100'],
            'code' => ['required', 'string', 'max:20', Rule::unique('departments', 'code')->ignore($id)],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre es obligatorio.',
            'name.max'      => 'El nombre no puede superar los 100 caracteres.',
            'code.required' => 'El código es obligatorio.',
            'code.max'      => 'El código no puede superar los 20 caracteres.',
            'code.unique'   => 'Ya existe un departamento con ese código.',
        ];
    }
}
