<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tam_surveys', function (Blueprint $table) {
            $table->unsignedTinyInteger('pu2_faster')->nullable()->after('pu1_useful');
            $table->unsignedTinyInteger('pu3_productivity')->nullable()->after('pu2_faster');
            $table->unsignedTinyInteger('pu4_effectiveness')->nullable()->after('pu3_productivity');
            $table->unsignedTinyInteger('peou1_easy_to_learn')->nullable()->after('pu4_effectiveness');
            $table->unsignedTinyInteger('peou2_controllable')->nullable()->after('peou1_easy_to_learn');
            $table->unsignedTinyInteger('peou3_clear_understandable')->nullable()->after('peou2_controllable');
            $table->unsignedTinyInteger('bi2_recommend')->nullable()->after('bi1_intend_to_use');
            $table->timestamp('updated_at')->nullable()->after('created_at');
        });
    }

    public function down(): void
    {
        Schema::table('tam_surveys', function (Blueprint $table) {
            $table->dropColumn([
                'pu2_faster',
                'pu3_productivity',
                'pu4_effectiveness',
                'peou1_easy_to_learn',
                'peou2_controllable',
                'peou3_clear_understandable',
                'bi2_recommend',
                'updated_at',
            ]);
        });
    }
};
