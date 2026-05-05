<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProvinceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $action = $this->isMethod('post') ? 'geography.create' : 'geography.edit';
        return $this->user()?->can($action) ?? false;
    }

    public function rules(): array
    {
        $id = $this->route('province')?->id;

        return [
            'department_id' => ['required_without:province', 'exists:departments,id'],
            'name'          => ['required', 'string', 'max:100'],
            'code'          => ['required', 'string', 'max:20', Rule::unique('provinces', 'code')->ignore($id)],
        ];
    }

    public function messages(): array
    {
        return [
            'department_id.required_without' => 'El departamento es obligatorio.',
            'department_id.exists'           => 'El departamento seleccionado no existe.',
            'name.required'                  => 'El nombre es obligatorio.',
            'name.max'                       => 'El nombre no puede superar los 100 caracteres.',
            'code.required'                  => 'El código es obligatorio.',
            'code.max'                       => 'El código no puede superar los 20 caracteres.',
            'code.unique'                    => 'Ya existe una provincia con ese código.',
        ];
    }
}
