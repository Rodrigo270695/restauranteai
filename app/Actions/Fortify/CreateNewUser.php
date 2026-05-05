<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\RestaurantProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    public function create(array $input): User
    {
        $role = $input['role'] ?? 'tourist';

        if ($role === 'restaurant_owner') {
            if (isset($input['business_name'])) {
                $input['business_name'] = trim((string) $input['business_name']);
            }
            if (array_key_exists('ruc', $input)) {
                $ruc = trim((string) $input['ruc']);
                $input['ruc'] = $ruc === '' ? null : $ruc;
            }
        }

        $rules = [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
            'role' => ['required', 'string', 'in:tourist,restaurant_owner'],
        ];

        // Campos extra para dueños de restaurante
        if ($role === 'restaurant_owner') {
            $rules['ruc'] = [
                'nullable',
                'string',
                'size:11',
                'regex:/^\d{11}$/',
                Rule::unique('restaurant_profiles', 'ruc')->whereNull('deleted_at'),
            ];
            $rules['business_name'] = [
                'required',
                'string',
                'max:255',
                Rule::unique('restaurant_profiles', 'business_name')->whereNull('deleted_at'),
            ];
            $rules['phone'] = ['nullable', 'string', 'max:20'];
            $rules['address'] = ['nullable', 'string', 'max:500'];
            $rules['city'] = ['nullable', 'string', 'max:100'];
        }

        $messages = $role === 'restaurant_owner'
            ? [
                'ruc.unique' => 'Este RUC ya está registrado con otra cuenta.',
                'business_name.unique' => 'Esta razón social ya está registrada.',
            ]
            : [];

        Validator::make($input, $rules, $messages)->validate();

        return DB::transaction(function () use ($input, $role) {
            $user = User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
            ]);

            $user->assignRole($role);

            if ($role === 'restaurant_owner') {
                RestaurantProfile::create([
                    'user_id' => $user->id,
                    'ruc' => $input['ruc'] ?? null,
                    'business_name' => $input['business_name'],
                    'phone' => $input['phone'] ?? null,
                    'address' => $input['address'] ?? null,
                    'city' => $input['city'] ?? null,
                    'status' => 'pending',
                ]);
            }

            return $user;
        });
    }
}
