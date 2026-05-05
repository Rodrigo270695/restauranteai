<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('super_admin') ?? false;
    }

    public function rules(): array
    {
        $userId     = $this->route('user')?->id;
        $isUpdate   = $this->isMethod('PUT') || $this->isMethod('PATCH');
        $onlyRoles  = $isUpdate
            && ! $this->has('name')
            && ! $this->has('email')
            && ! $this->has('password');

        if ($onlyRoles) {
            return [
                'roles'   => ['required', 'array'],
                'roles.*' => ['string', 'exists:roles,name'],
            ];
        }

        if ($isUpdate) {
            return [
                'name'  => ['sometimes', 'required', 'string', 'max:255'],
                'email' => ['sometimes', 'required', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
                'password' => ['nullable', 'string', 'min:8', 'confirmed'],
                'roles'   => ['nullable', 'array'],
                'roles.*' => ['string', 'exists:roles,name'],
            ];
        }

        return [
            'name'  => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'roles'   => ['nullable', 'array'],
            'roles.*' => ['string', 'exists:roles,name'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'     => 'El nombre es obligatorio.',
            'email.required'    => 'El correo es obligatorio.',
            'email.unique'     => 'Ese correo ya está registrado.',
            'password.required' => 'La contraseña es obligatoria.',
            'password.min'      => 'La contraseña debe tener al menos 8 caracteres.',
            'roles.*'           => 'Uno o más roles no son válidos.',
        ];
    }
}
