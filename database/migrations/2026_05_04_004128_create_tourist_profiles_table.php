<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tourist_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('avatar_url')->nullable();
            $table->text('bio')->nullable();
            $table->string('city', 100)->nullable();
            $table->date('birth_date')->nullable();
            $table->json('preferred_cuisines')->nullable();
            $table->enum('budget_preference', ['low', 'medium', 'high'])->nullable();

            // null = setup pendiente, filled = setup completado
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tourist_profiles');
    }
};
