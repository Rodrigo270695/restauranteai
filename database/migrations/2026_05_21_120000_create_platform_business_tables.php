<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cuisine_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->string('slug', 80)->unique();
            $table->text('description')->nullable();
            $table->string('icon', 100)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('ambiances', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->string('slug', 80)->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->string('slug', 80)->unique();
            $table->string('icon', 100)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('dish_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->string('slug', 80)->unique();
            $table->unsignedTinyInteger('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('support_languages', function (Blueprint $table) {
            $table->id();
            $table->string('name', 60);
            $table->string('code', 10)->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('restaurants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('district_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('cuisine_type_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('ambiance_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name', 150);
            $table->string('slug', 180)->unique();
            $table->text('description')->nullable();
            $table->string('short_description', 255)->nullable();
            $table->string('address', 255)->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('whatsapp', 20)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('website')->nullable();
            $table->enum('price_range', ['economico', 'moderado', 'premium'])->default('moderado');
            $table->decimal('avg_price_per_person', 8, 2)->nullable();
            $table->unsignedSmallInteger('capacity')->nullable();
            $table->string('cover_image')->nullable();
            $table->decimal('avg_rating', 3, 2)->default(0);
            $table->unsignedInteger('total_reviews')->default(0);
            $table->unsignedInteger('total_views')->default(0);
            $table->boolean('is_active')->default(false);
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('restaurant_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->string('alt_text', 150)->nullable();
            $table->enum('type', ['exterior', 'interior', 'platos', 'ambiente'])->default('interior');
            $table->unsignedTinyInteger('display_order')->default(0);
            $table->boolean('is_cover')->default(false);
            $table->timestamps();
        });

        Schema::create('restaurant_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week');
            $table->time('opens_at')->nullable();
            $table->time('closes_at')->nullable();
            $table->boolean('is_closed')->default(false);
            $table->timestamps();
            $table->unique(['restaurant_id', 'day_of_week']);
        });

        Schema::create('restaurant_service', function (Blueprint $table) {
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->primary(['restaurant_id', 'service_id']);
        });

        Schema::create('restaurant_language', function (Blueprint $table) {
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('support_language_id')->constrained()->cascadeOnDelete();
            $table->primary(['restaurant_id', 'support_language_id']);
        });

        Schema::create('dishes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('dish_category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name', 120);
            $table->text('description')->nullable();
            $table->decimal('price', 8, 2);
            $table->string('image')->nullable();
            $table->boolean('is_signature')->default(false);
            $table->boolean('is_available')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->unsignedTinyInteger('display_order')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('comment')->nullable();
            $table->boolean('is_visible')->default(true);
            $table->text('owner_response')->nullable();
            $table->timestamp('owner_responded_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'restaurant_id']);
        });

        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('title', 150);
            $table->text('description')->nullable();
            $table->enum('type', ['descuento', 'evento', 'menu_especial', '2x1', 'otro'])->default('descuento');
            $table->decimal('discount_percent', 5, 2)->nullable();
            $table->string('image')->nullable();
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('user_interactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('restaurant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('interaction_type', 40);
            $table->string('search_query', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('recommendation_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('budget', 20)->nullable();
            $table->string('party_type', 30)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('recommendations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_id')->constrained('recommendation_requests')->cascadeOnDelete();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rank')->default(1);
            $table->decimal('score', 8, 6)->default(0);
            $table->boolean('was_viewed')->default(false);
            $table->boolean('was_accepted')->default(false);
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('tam_surveys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('pu1_useful')->default(3);
            $table->unsignedTinyInteger('peou4_easy_to_use')->default(3);
            $table->unsignedTinyInteger('bi1_intend_to_use')->default(3);
            $table->text('open_comment')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tam_surveys');
        Schema::dropIfExists('recommendations');
        Schema::dropIfExists('recommendation_requests');
        Schema::dropIfExists('user_interactions');
        Schema::dropIfExists('promotions');
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('dishes');
        Schema::dropIfExists('restaurant_language');
        Schema::dropIfExists('restaurant_service');
        Schema::dropIfExists('restaurant_schedules');
        Schema::dropIfExists('restaurant_images');
        Schema::dropIfExists('restaurants');
        Schema::dropIfExists('support_languages');
        Schema::dropIfExists('dish_categories');
        Schema::dropIfExists('services');
        Schema::dropIfExists('ambiances');
        Schema::dropIfExists('cuisine_types');
    }
};
