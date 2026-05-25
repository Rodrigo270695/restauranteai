<?php

namespace App\Support;

use App\Models\Recommendation;
use App\Models\RecommendationRequest;
use App\Models\TamSurvey;
use App\Models\UserInteraction;
use Carbon\Carbon;
use DateTimeInterface;

class AdminReadOnlyPresenter
{
    private static function formatTimestamp(mixed $value): string
    {
        if ($value === null || $value === '') {
            return '—';
        }

        if ($value instanceof DateTimeInterface) {
            return $value->format('d/m/Y H:i');
        }

        try {
            return Carbon::parse((string) $value)->format('d/m/Y H:i');
        } catch (\Throwable) {
            return (string) $value;
        }
    }

    /**
     * @return array<string, mixed>
     */
    public static function tamSurvey(TamSurvey $survey): array
    {
        $survey->loadMissing('user:id,name,email');

        $pu = collect([$survey->pu1_useful, $survey->pu2_faster, $survey->pu3_productivity, $survey->pu4_effectiveness])
            ->map(fn ($v) => (float) $v);
        $peou = collect([$survey->peou1_easy_to_learn, $survey->peou2_controllable, $survey->peou3_clear_understandable, $survey->peou4_easy_to_use])
            ->map(fn ($v) => (float) $v);
        $bi = collect([$survey->bi1_intend_to_use, $survey->bi2_recommend])->map(fn ($v) => (float) $v);

        return [
            'id' => $survey->id,
            'user_name' => $survey->user?->name ?? '—',
            'user_email' => $survey->user?->email ?? '—',
            'pu_avg' => round($pu->avg(), 2),
            'peou_avg' => round($peou->avg(), 2),
            'bi_avg' => round($bi->avg(), 2),
            'pu1_useful' => (int) $survey->pu1_useful,
            'pu2_faster' => (int) $survey->pu2_faster,
            'pu3_productivity' => (int) $survey->pu3_productivity,
            'pu4_effectiveness' => (int) $survey->pu4_effectiveness,
            'bi1_intend_to_use' => (int) $survey->bi1_intend_to_use,
            'bi2_recommend' => (int) $survey->bi2_recommend,
            'open_comment' => $survey->open_comment
                ? (strlen($survey->open_comment) > 80 ? substr($survey->open_comment, 0, 80).'…' : $survey->open_comment)
                : '—',
            'created_at' => self::formatTimestamp($survey->created_at),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function recommendation(Recommendation $rec): array
    {
        $rec->loadMissing(['restaurant:id,name,slug', 'request.user:id,name']);

        return [
            'id' => $rec->id,
            'restaurant_name' => $rec->restaurant?->name ?? '—',
            'user_name' => $rec->request?->user?->name ?? '—',
            'request_id' => $rec->request_id,
            'rank' => (int) $rec->rank,
            'score_pct' => (int) round((float) $rec->score * 100),
            'was_viewed' => $rec->was_viewed ? 'Sí' : 'No',
            'was_accepted' => $rec->was_accepted ? 'Sí' : 'No',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function recommendationRequest(RecommendationRequest $request): array
    {
        $request->loadMissing(['user:id,name', 'recommendations']);

        return [
            'id' => $request->id,
            'user_name' => $request->user?->name ?? '—',
            'budget' => $request->budget ?? '—',
            'party_type' => $request->party_type ?? '—',
            'results_count' => $request->recommendations->count(),
            'created_at' => self::formatTimestamp($request->created_at),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function userInteraction(UserInteraction $interaction): array
    {
        $interaction->loadMissing(['user:id,name', 'restaurant:id,name']);

        return [
            'id' => $interaction->id,
            'user_name' => $interaction->user?->name ?? '—',
            'restaurant_name' => $interaction->restaurant?->name ?? '—',
            'interaction_type' => $interaction->interaction_type,
            'search_query' => $interaction->search_query ?? '—',
            'created_at' => self::formatTimestamp($interaction->created_at),
        ];
    }
}
