<?php

namespace Database\Seeders;

use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Seeder;

class CleanupPhantomDataSeeder extends Seeder
{
    /**
     * Elimina restaurantes creados por error bajo cuentas super_admin.
     */
    public function run(): void
    {
        $adminIds = User::role('super_admin')->pluck('id');

        if ($adminIds->isEmpty()) {
            return;
        }

        $query = Restaurant::query()->whereIn('owner_id', $adminIds);
        $count = $query->count();
        $query->forceDelete();

        $this->command?->info("✔ Restaurantes fantasma de super_admin eliminados: {$count}.");
    }
}
