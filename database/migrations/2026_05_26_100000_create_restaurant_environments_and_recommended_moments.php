<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurant_environments', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->string('slug', 80)->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('recommended_moments', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->string('slug', 80)->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('restaurant_environment', function (Blueprint $table) {
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('restaurant_environment_id')->constrained()->cascadeOnDelete();
            $table->primary(['restaurant_id', 'restaurant_environment_id']);
        });

        Schema::create('restaurant_recommended_moment', function (Blueprint $table) {
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recommended_moment_id')->constrained()->cascadeOnDelete();
            $table->primary(['restaurant_id', 'recommended_moment_id']);
        });

        Schema::table('user_preferences', function (Blueprint $table) {
            if (! Schema::hasColumn('user_preferences', 'restaurant_environment_ids')) {
                $table->json('restaurant_environment_ids')->nullable()->after('dietary_option_ids');
            }
            if (! Schema::hasColumn('user_preferences', 'recommended_moment_ids')) {
                $table->json('recommended_moment_ids')->nullable()->after('restaurant_environment_ids');
            }
        });
    }

    public function down(): void
    {
        Schema::table('user_preferences', function (Blueprint $table) {
            if (Schema::hasColumn('user_preferences', 'recommended_moment_ids')) {
                $table->dropColumn('recommended_moment_ids');
            }
            if (Schema::hasColumn('user_preferences', 'restaurant_environment_ids')) {
                $table->dropColumn('restaurant_environment_ids');
            }
        });

        Schema::dropIfExists('restaurant_recommended_moment');
        Schema::dropIfExists('restaurant_environment');
        Schema::dropIfExists('recommended_moments');
        Schema::dropIfExists('restaurant_environments');
    }
};
