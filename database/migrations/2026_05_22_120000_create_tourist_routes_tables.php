<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tourist_routes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('slug', 150);
            $table->text('description')->nullable();
            $table->enum('status', ['draft', 'active'])->default('draft');
            $table->unsignedTinyInteger('stops_count')->default(0);
            $table->decimal('total_distance_km', 8, 2)->nullable();
            $table->unsignedSmallInteger('estimated_minutes')->nullable();
            $table->json('path_coordinates')->nullable()->comment('[[lat,lng],...] orden de paradas');
            $table->timestamps();

            $table->unique(['user_id', 'slug']);
            $table->index(['user_id', 'status']);
        });

        Schema::create('tourist_route_stops', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tourist_route_id')->constrained()->cascadeOnDelete();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('position')->default(1);
            $table->string('note', 255)->nullable();
            $table->timestamps();

            $table->unique(['tourist_route_id', 'restaurant_id']);
            $table->unique(['tourist_route_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tourist_route_stops');
        Schema::dropIfExists('tourist_routes');
    }
};
