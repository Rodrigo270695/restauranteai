<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ml_training_runs', function (Blueprint $table) {
            $table->id();
            $table->string('status', 20);
            $table->string('message', 500);
            $table->timestamp('started_at');
            $table->timestamp('finished_at');
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->json('result')->nullable();
            $table->foreignId('triggered_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('triggered_by_name', 120);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ml_training_runs');
    }
};
