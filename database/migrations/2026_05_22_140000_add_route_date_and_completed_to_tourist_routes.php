<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tourist_routes', function (Blueprint $table) {
            $table->date('route_date')->nullable()->after('description');
            $table->timestamp('completed_at')->nullable()->after('route_date');
        });

        DB::table('tourist_routes')
            ->where('status', 'active')
            ->whereNull('route_date')
            ->update(['route_date' => DB::raw('DATE(created_at)')]);
    }

    public function down(): void
    {
        Schema::table('tourist_routes', function (Blueprint $table) {
            $table->dropColumn(['route_date', 'completed_at']);
        });
    }
};
