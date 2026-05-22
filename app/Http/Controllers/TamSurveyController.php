<?php

namespace App\Http\Controllers;

use App\Http\Requests\Explore\TamSurveyRequest;
use App\Models\TamSurvey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class TamSurveyController extends Controller
{
    public function show(Request $request): mixed
    {
        $user = $request->user();

        if (! $user->hasRole('tourist')) {
            return Redirect::route('dashboard');
        }

        $existing = TamSurvey::query()->where('user_id', $user->id)->first();

        return Inertia::render('explore/tam-survey', [
            'completed' => $existing !== null,
            'survey' => $existing ? [
                'pu1_useful' => $existing->pu1_useful,
                'pu2_faster' => $existing->pu2_faster,
                'pu3_productivity' => $existing->pu3_productivity,
                'pu4_effectiveness' => $existing->pu4_effectiveness,
                'peou1_easy_to_learn' => $existing->peou1_easy_to_learn,
                'peou2_controllable' => $existing->peou2_controllable,
                'peou3_clear_understandable' => $existing->peou3_clear_understandable,
                'peou4_easy_to_use' => $existing->peou4_easy_to_use,
                'bi1_intend_to_use' => $existing->bi1_intend_to_use,
                'bi2_recommend' => $existing->bi2_recommend,
                'open_comment' => $existing->open_comment,
            ] : null,
            'questions' => $this->questions(),
        ]);
    }

    public function store(TamSurveyRequest $request): mixed
    {
        $user = $request->user();

        if (TamSurvey::query()->where('user_id', $user->id)->exists()) {
            return Redirect::route('explore.tam-survey')->with('info', 'already_submitted');
        }

        TamSurvey::query()->create([
            'user_id' => $user->id,
            ...$request->validated(),
        ]);

        return Redirect::route('explore.index')->with('tam_success', true);
    }

    /** @return array<int, array{key: string, group: string, text: string}> */
    private function questions(): array
    {
        return [
            ['key' => 'pu1_useful', 'group' => 'PU', 'text' => 'El sistema me ayuda a encontrar restaurantes adecuados.'],
            ['key' => 'pu2_faster', 'group' => 'PU', 'text' => 'El sistema me ahorra tiempo al decidir dónde comer.'],
            ['key' => 'pu3_productivity', 'group' => 'PU', 'text' => 'El sistema mejora mi experiencia turística gastronómica.'],
            ['key' => 'pu4_effectiveness', 'group' => 'PU', 'text' => 'Las recomendaciones del sistema son relevantes para mí.'],
            ['key' => 'peou1_easy_to_learn', 'group' => 'PEOU', 'text' => 'Aprender a usar el sistema es fácil.'],
            ['key' => 'peou2_controllable', 'group' => 'PEOU', 'text' => 'Puedo controlar el sistema con facilidad.'],
            ['key' => 'peou3_clear_understandable', 'group' => 'PEOU', 'text' => 'La interacción con el sistema es clara y comprensible.'],
            ['key' => 'peou4_easy_to_use', 'group' => 'PEOU', 'text' => 'En general, el sistema es fácil de usar.'],
            ['key' => 'bi1_intend_to_use', 'group' => 'BI', 'text' => 'Tengo intención de seguir usando el sistema.'],
            ['key' => 'bi2_recommend', 'group' => 'BI', 'text' => 'Recomendaría el sistema a otros turistas.'],
        ];
    }
}
