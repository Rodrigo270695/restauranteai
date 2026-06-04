<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            if (Schema::hasTable('restaurants')) {
                DB::statement("ALTER TABLE restaurants MODIFY price_range ENUM('economico', 'moderado', 'premium', 'caro') NOT NULL DEFAULT 'moderado'");
            }

            if (Schema::hasTable('user_preferences')) {
                DB::statement("ALTER TABLE user_preferences MODIFY price_range ENUM('economico', 'moderado', 'premium', 'caro') NULL");
            }
        }

        if (Schema::hasTable('restaurants')) {
            DB::table('restaurants')->where('price_range', 'premium')->update(['price_range' => 'caro']);
        }

        if (Schema::hasTable('user_preferences')) {
            DB::table('user_preferences')->where('price_range', 'premium')->update(['price_range' => 'caro']);
        }

        if (Schema::hasTable('recommendation_requests')) {
            DB::table('recommendation_requests')->where('budget', 'premium')->update(['budget' => 'caro']);
        }

        if (DB::getDriverName() === 'mysql') {
            if (Schema::hasTable('restaurants')) {
                DB::statement("ALTER TABLE restaurants MODIFY price_range ENUM('economico', 'moderado', 'caro') NOT NULL DEFAULT 'moderado'");
            }

            if (Schema::hasTable('user_preferences')) {
                DB::statement("ALTER TABLE user_preferences MODIFY price_range ENUM('economico', 'moderado', 'caro') NULL");
            }
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            if (Schema::hasTable('restaurants')) {
                DB::statement("ALTER TABLE restaurants MODIFY price_range ENUM('economico', 'moderado', 'premium', 'caro') NOT NULL DEFAULT 'moderado'");
            }

            if (Schema::hasTable('user_preferences')) {
                DB::statement("ALTER TABLE user_preferences MODIFY price_range ENUM('economico', 'moderado', 'premium', 'caro') NULL");
            }
        }

        if (Schema::hasTable('restaurants')) {
            DB::table('restaurants')->where('price_range', 'caro')->update(['price_range' => 'premium']);
        }

        if (Schema::hasTable('user_preferences')) {
            DB::table('user_preferences')->where('price_range', 'caro')->update(['price_range' => 'premium']);
        }

        if (Schema::hasTable('recommendation_requests')) {
            DB::table('recommendation_requests')->where('budget', 'caro')->update(['budget' => 'premium']);
        }

        if (DB::getDriverName() === 'mysql') {
            if (Schema::hasTable('restaurants')) {
                DB::statement("ALTER TABLE restaurants MODIFY price_range ENUM('economico', 'moderado', 'premium') NOT NULL DEFAULT 'moderado'");
            }

            if (Schema::hasTable('user_preferences')) {
                DB::statement("ALTER TABLE user_preferences MODIFY price_range ENUM('economico', 'moderado', 'premium') NULL");
            }
        }
    }
};
