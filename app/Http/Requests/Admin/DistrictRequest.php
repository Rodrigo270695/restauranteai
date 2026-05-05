<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DistrictRequest extends FormRequest
{
    public function authorize(): bool
    {
        $action = $this->isMethod('post') ? 'geography.create' : 'geography.edit';
        return $this->user()?->can($action) ?? false;
    }

    public function rules(): array
    {
        $id = $this->route('district')?->id;

        return [
            'province_id' => ['required_without:district', 'exists:provinces,id'],
            'name'        => ['required', 'string', 'max:100'],
            'code'        => ['required', 'string', 'max:20', Rule::unique('districts', 'code')->ignore($id)],
        ];
    }

    public function messages(): array
    {
        return [
            'province_id.required_without' => 'La provincia es obligatoria.',
            'province_id.exists'           => 'La provincia seleccionada no existe.',
            'name.required'                => 'El nombre es obligatorio.',
            'name.max'                     => 'El nombre no puede superar los 100 caracteres.',
            'code.required'                => 'El código es obligatorio.',
            'code.max'                     => 'El código no puede superar los 20 caracteres.',
            'code.unique'                  => 'Ya existe un distrito con ese código.',
        ];
    }
}
