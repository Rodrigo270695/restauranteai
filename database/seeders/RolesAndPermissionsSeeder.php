<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Árbol de permisos organizado por módulo → recurso → acciones.
     * Ir agregando aquí a medida que se desarrollan los módulos.
     */
    public const PERMISSION_TREE = [
        // Módulo: Dashboard
        'dashboard' => [
            'label' => 'Dashboard',
            'items' => [
                'dashboard' => [
                    'label' => 'Dashboard',
                    'permissions' => [
                        'dashboard.view' => 'Ver dashboard',
                    ],
                ],
            ],
        ],

        // Módulo: Administración
        'admin' => [
            'label' => 'Administración',
            'items' => [
                'roles' => [
                    'label' => 'Roles',
                    'permissions' => [
                        'roles.view'               => 'Ver roles',
                        'roles.create'             => 'Crear roles',
                        'roles.edit'               => 'Editar roles',
                        'roles.delete'             => 'Eliminar roles',
                        'roles.assign_permissions' => 'Asignar permisos a roles',
                    ],
                ],
                'users' => [
                    'label' => 'Usuarios',
                    'permissions' => [
                        'users.view'         => 'Ver usuarios',
                        'users.create'       => 'Crear usuarios',
                        'users.edit'         => 'Editar usuarios',
                        'users.delete'       => 'Eliminar usuarios',
                        'users.assign_roles' => 'Asignar roles a usuarios',
                    ],
                ],
                'business_approval' => [
                    'label' => 'Aprobación de negocios',
                    'permissions' => [
                        'owners.approve_business' => 'Aprobar negocios de restaurante',
                    ],
                ],
            ],
        ],

        // Módulo: Catálogos
        'catalogs' => [
            'label' => 'Catálogos',
            'items' => [
                'geography' => [
                    'label' => 'Geografía',
                    'permissions' => [
                        'geography.view'   => 'Ver geografía',
                        'geography.create' => 'Crear registros geográficos',
                        'geography.edit'   => 'Editar registros geográficos',
                        'geography.delete' => 'Eliminar registros geográficos',
                    ],
                ],
            ],
        ],
    ];

    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Extraer lista plana de permisos desde el árbol
        $treePermissions = [];
        foreach (self::PERMISSION_TREE as $module) {
            foreach ($module['items'] as $item) {
                foreach (array_keys($item['permissions']) as $perm) {
                    $treePermissions[] = $perm;
                }
            }
        }

        // Eliminar permisos que ya no están en el árbol
        Permission::whereNotIn('name', $treePermissions)->delete();

        // Crear/asegurar los permisos del árbol
        foreach ($treePermissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // ── ROLES ─────────────────────────────────────────────────────────────

        // SUPER ADMIN — acceso total (usar objetos Permission para máxima fiabilidad)
        $superAdmin = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        $allPerms = Permission::whereIn('name', $treePermissions)->get();
        $superAdmin->syncPermissions($allPerms);

        // RESTAURANT OWNER — sin permisos de admin por ahora
        $restaurantOwner = Role::firstOrCreate(['name' => 'restaurant_owner', 'guard_name' => 'web']);
        $restaurantOwner->syncPermissions([]);

        // TOURIST — sin permisos de admin
        $tourist = Role::firstOrCreate(['name' => 'tourist', 'guard_name' => 'web']);
        $tourist->syncPermissions([]);

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->command->info('✔ Roles y permisos actualizados.');
    }
}
