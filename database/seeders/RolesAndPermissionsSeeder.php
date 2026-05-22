<?php

namespace Database\Seeders;

use App\Support\PermissionTree;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $treePermissions = PermissionTree::allNames();

        Permission::whereNotIn('name', $treePermissions)->delete();

        foreach ($treePermissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $allPerms = Permission::whereIn('name', $treePermissions)->get();

        $superAdmin = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        $superAdmin->syncPermissions($allPerms);

        $restaurantOwner = Role::firstOrCreate(['name' => 'restaurant_owner', 'guard_name' => 'web']);
        $ownerPerms = Permission::whereIn('name', PermissionTree::restaurantOwnerDefaults())->get();
        $restaurantOwner->syncPermissions($ownerPerms);

        $tourist = Role::firstOrCreate(['name' => 'tourist', 'guard_name' => 'web']);
        $tourist->syncPermissions([]);

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->command->info('✔ Roles y permisos actualizados.');
        $this->command->info('   super_admin: '.$allPerms->count().' permisos');
        $this->command->info('   restaurant_owner: '.$ownerPerms->count().' permisos');
        $this->command->info('   tourist: 0 permisos (portal explore)');
    }
}
