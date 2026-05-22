<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurant_cuisine_type', function (Blueprint $table) {
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cuisine_type_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->primary(['restaurant_id', 'cuisine_type_id']);
            $table->index(['cuisine_type_id', 'is_primary']);
        });

        foreach (DB::table('restaurants')->whereNotNull('cuisine_type_id')->get() as $row) {
            DB::table('restaurant_cuisine_type')->insertOrIgnore([
                'restaurant_id' => $row->id,
                'cuisine_type_id' => $row->cuisine_type_id,
                'is_primary' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_cuisine_type');
    }
};
