<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurant_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tourist_route_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('tourist_route_stop_id')->nullable()->constrained()->nullOnDelete();
            $table->dateTime('reserved_for');
            $table->unsignedTinyInteger('party_size')->default(2);
            $table->enum('status', ['pending', 'confirmed', 'visited', 'cancelled'])->default('pending');
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('visited_at')->nullable();
            $table->string('note', 500)->nullable();
            $table->timestamps();

            $table->index(['user_id', 'restaurant_id', 'status']);
            $table->index(['tourist_route_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_reservations');
    }
};
