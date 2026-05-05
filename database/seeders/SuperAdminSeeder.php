<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\PermissionRegistrar;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // updateOrCreate garantiza que email_verified_at siempre quede seteado,
        // incluso si el usuario ya existía sin verificación.
        $admin = User::updateOrCreate(
            ['email' => 'admin@restauranteai.com'],
            [
                'name'              => 'Super Administrador',
                'password'          => Hash::make('Admin1234!'),
                'email_verified_at' => now(),
            ]
        );

        // syncRoles evita duplicados si se corre el seeder varias veces
        $admin->syncRoles(['super_admin']);

        $this->command->info('✔ Super Admin listo: admin@restauranteai.com / Admin1234!');
        $this->command->warn('  ⚠ Cambia la contraseña en producción.');
    }
}
