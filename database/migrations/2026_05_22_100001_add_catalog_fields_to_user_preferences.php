<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_preferences', function (Blueprint $table) {
            if (! Schema::hasColumn('user_preferences', 'service_ids')) {
                $table->json('service_ids')->nullable()->after('dietary_restriction');
            }
            if (! Schema::hasColumn('user_preferences', 'language_ids')) {
                $table->json('language_ids')->nullable()->after('service_ids');
            }
            if (! Schema::hasColumn('user_preferences', 'min_rating')) {
                $table->decimal('min_rating', 2, 1)->nullable()->after('language_ids');
            }
        });
    }

    public function down(): void
    {
        Schema::table('user_preferences', function (Blueprint $table) {
            $table->dropColumn(['service_ids', 'language_ids', 'min_rating']);
        });
    }
};
