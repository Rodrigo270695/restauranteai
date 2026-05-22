<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cuisine_type_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('ambiance_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('price_range', ['economico', 'moderado', 'premium'])->nullable();
            $table->decimal('max_distance_km', 5, 2)->nullable();
            $table->enum('party_type', ['solo', 'pareja', 'familia', 'amigos', 'negocios'])->nullable();
            $table->enum('dietary_restriction', ['ninguna', 'vegetariano', 'vegano', 'sin_gluten', 'halal'])->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('cuisine_type_id');
            $table->index('price_range');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_preferences');
    }
};
