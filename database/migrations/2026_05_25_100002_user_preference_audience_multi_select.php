<?php

use App\Models\DietaryOption;
use App\Models\PartyType;
use App\Models\UserPreference;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_preferences', function (Blueprint $table) {
            if (! Schema::hasColumn('user_preferences', 'party_type_ids')) {
                $table->json('party_type_ids')->nullable()->after('max_distance_km');
            }
            if (! Schema::hasColumn('user_preferences', 'dietary_option_ids')) {
                $table->json('dietary_option_ids')->nullable()->after('party_type_ids');
            }
        });

        if (Schema::hasColumn('user_preferences', 'party_type')) {
            UserPreference::query()->each(function (UserPreference $pref) {
                $updates = [];

                if ($pref->party_type) {
                    $id = PartyType::query()->where('slug', $pref->party_type)->value('id');
                    if ($id) {
                        $updates['party_type_ids'] = [$id];
                    }
                }

                if ($pref->dietary_restriction) {
                    $id = DietaryOption::query()->where('slug', $pref->dietary_restriction)->value('id');
                    if ($id) {
                        $updates['dietary_option_ids'] = [$id];
                    }
                }

                if ($updates !== []) {
                    $pref->update($updates);
                }
            });

            Schema::table('user_preferences', function (Blueprint $table) {
                $table->dropColumn(['party_type', 'dietary_restriction']);
            });
        }
    }

    public function down(): void
    {
        Schema::table('user_preferences', function (Blueprint $table) {
            if (! Schema::hasColumn('user_preferences', 'party_type')) {
                $table->string('party_type', 30)->nullable()->after('max_distance_km');
                $table->string('dietary_restriction', 30)->nullable()->after('party_type');
            }
        });

        UserPreference::query()->each(function (UserPreference $pref) {
            $partySlug = null;
            $dietarySlug = null;

            $partyIds = $pref->party_type_ids ?? [];
            if (is_array($partyIds) && $partyIds !== []) {
                $partySlug = PartyType::query()->whereKey($partyIds[0])->value('slug');
            }

            $dietaryIds = $pref->dietary_option_ids ?? [];
            if (is_array($dietaryIds) && $dietaryIds !== []) {
                $dietarySlug = DietaryOption::query()->whereKey($dietaryIds[0])->value('slug');
            }

            $pref->update([
                'party_type' => $partySlug,
                'dietary_restriction' => $dietarySlug,
            ]);
        });

        Schema::table('user_preferences', function (Blueprint $table) {
            $table->dropColumn(['party_type_ids', 'dietary_option_ids']);
        });
    }
};
