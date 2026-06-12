<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tourist_routes') || Schema::hasColumn('tourist_routes', 'generated_by_ai')) {
            return;
        }

        Schema::table('tourist_routes', function (Blueprint $table) {
            $table->boolean('generated_by_ai')->default(false)->after('status');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('tourist_routes') || ! Schema::hasColumn('tourist_routes', 'generated_by_ai')) {
            return;
        }

        Schema::table('tourist_routes', function (Blueprint $table) {
            $table->dropColumn('generated_by_ai');
        });
    }
};
