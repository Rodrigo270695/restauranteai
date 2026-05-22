<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Recommendation;
use App\Models\RecommendationRequest;
use App\Models\TamSurvey;
use App\Models\UserInteraction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReadOnlyDataController extends Controller
{
    public function userInteractions(Request $request): Response
    {
        abort_unless($request->user()?->can('interactions.view'), 403);

        return $this->renderList(
            'app/admin/user-interactions',
            'Interacciones',
            UserInteraction::with(['user:id,name', 'restaurant:id,name'])->latest('created_at'),
            $request,
        );
    }

    public function recommendationRequests(Request $request): Response
    {
        abort_unless($request->user()?->can('recommendation_requests.view'), 403);

        return $this->renderList(
            'app/admin/recommendation-requests',
            'Solicitudes ML',
            RecommendationRequest::with('user:id,name')->latest('created_at'),
            $request,
        );
    }

    public function recommendations(Request $request): Response
    {
        abort_unless($request->user()?->can('recommendations.view'), 403);

        return $this->renderList(
            'app/admin/recommendations',
            'Recomendaciones',
            Recommendation::with(['restaurant:id,name', 'request.user:id,name'])->latest('created_at'),
            $request,
        );
    }

    public function tamSurveys(Request $request): Response
    {
        abort_unless($request->user()?->can('tam_surveys.view'), 403);

        return $this->renderList(
            'app/admin/tam-surveys',
            'Encuestas TAM',
            TamSurvey::with('user:id,name')->latest('created_at'),
            $request,
        );
    }

    private function renderList(string $page, string $title, $query, Request $request): Response
    {
        $perPage = in_array((int) $request->input('per_page'), [10, 15, 25, 50]) ? (int) $request->input('per_page') : 15;

        return Inertia::render($page, [
            'title' => $title,
            'items' => $query->paginate($perPage)->withQueryString(),
            'readonly' => true,
        ]);
    }
}
