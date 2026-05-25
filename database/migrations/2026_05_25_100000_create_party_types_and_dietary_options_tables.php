<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('party_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->string('slug', 80)->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('dietary_options', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->string('slug', 80)->unique();
            $table->text('description')->nullable();
            $table->boolean('for_tourist_preference')->default(true);
            $table->boolean('for_restaurant')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('restaurant_party_type', function (Blueprint $table) {
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('party_type_id')->constrained()->cascadeOnDelete();
            $table->primary(['restaurant_id', 'party_type_id']);
        });

        Schema::create('restaurant_dietary_option', function (Blueprint $table) {
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('dietary_option_id')->constrained()->cascadeOnDelete();
            $table->primary(['restaurant_id', 'dietary_option_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_dietary_option');
        Schema::dropIfExists('restaurant_party_type');
        Schema::dropIfExists('dietary_options');
        Schema::dropIfExists('party_types');
    }
};
