<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('super_admin') ?? false;
    }

    public function rules(): array
    {
        $roleId      = $this->route('role')?->id;
        $isUpdate    = $this->isMethod('PUT') || $this->isMethod('PATCH');
        $onlyPerms   = $isUpdate && !$this->has('name');

        return [
            'name' => $onlyPerms
                ? ['sometimes', 'nullable']
                : [
                    'required',
                    'string',
                    'max:64',
                    'regex:/^[a-z][a-z0-9_]*$/',
                    Rule::unique('roles', 'name')->ignore($roleId),
                ],
            'permissions'   => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'  => 'El nombre del rol es obligatorio.',
            'name.max'       => 'El nombre no puede superar los 64 caracteres.',
            'name.regex'     => 'Solo letras minúsculas, números y guiones bajos (a–z, 0–9, _). Debe comenzar con una letra.',
            'name.unique'    => 'Ya existe un rol con ese nombre.',
            'permissions.*'  => 'Uno o más permisos no son válidos.',
        ];
    }
}
