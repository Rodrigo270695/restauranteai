<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurant_profiles', function (Blueprint $table) {
            $table->timestamp('post_approval_completed_at')->nullable()->after('approved_by');
        });
    }

    public function down(): void
    {
        Schema::table('restaurant_profiles', function (Blueprint $table) {
            $table->dropColumn('post_approval_completed_at');
        });
    }
};
