<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $existing = DB::table('tourist_profiles')
            ->whereNotNull('budget_preference')
            ->pluck('budget_preference', 'id');

        Schema::table('tourist_profiles', function (Blueprint $table) {
            $table->dropColumn('budget_preference');
        });

        Schema::table('tourist_profiles', function (Blueprint $table) {
            $table->json('budget_preference')->nullable()->after('preferred_cuisines');
        });

        foreach ($existing as $id => $budget) {
            DB::table('tourist_profiles')
                ->where('id', $id)
                ->update(['budget_preference' => json_encode([$budget])]);
        }
    }

    public function down(): void
    {
        $existing = DB::table('tourist_profiles')
            ->whereNotNull('budget_preference')
            ->pluck('budget_preference', 'id');

        Schema::table('tourist_profiles', function (Blueprint $table) {
            $table->dropColumn('budget_preference');
        });

        Schema::table('tourist_profiles', function (Blueprint $table) {
            $table->enum('budget_preference', ['low', 'medium', 'high'])->nullable()->after('preferred_cuisines');
        });

        foreach ($existing as $id => $budgetJson) {
            $decoded = json_decode((string) $budgetJson, true);
            $first = is_array($decoded) ? ($decoded[0] ?? null) : null;

            if (in_array($first, ['low', 'medium', 'high'], true)) {
                DB::table('tourist_profiles')
                    ->where('id', $id)
                    ->update(['budget_preference' => $first]);
            }
        }
    }
};
