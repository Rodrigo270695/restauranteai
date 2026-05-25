<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Recommendation;
use App\Models\RecommendationRequest;
use App\Models\TamSurvey;
use App\Models\UserInteraction;
use App\Support\AdminReadOnlyPresenter;
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
            'user_interactions',
        );
    }

    public function recommendationRequests(Request $request): Response
    {
        abort_unless($request->user()?->can('recommendation_requests.view'), 403);

        return $this->renderList(
            'app/admin/recommendation-requests',
            'Solicitudes ML',
            RecommendationRequest::with(['user:id,name', 'recommendations'])->latest('created_at'),
            $request,
            'recommendation_requests',
        );
    }

    public function recommendations(Request $request): Response
    {
        abort_unless($request->user()?->can('recommendations.view'), 403);

        return $this->renderList(
            'app/admin/recommendations',
            'Recomendaciones',
            Recommendation::with(['restaurant:id,name,slug', 'request.user:id,name'])->latest('created_at'),
            $request,
            'recommendations',
        );
    }

    public function tamSurveys(Request $request): Response
    {
        abort_unless($request->user()?->can('tam_surveys.view'), 403);

        return $this->renderList(
            'app/admin/tam-surveys',
            'Encuestas TAM',
            TamSurvey::with('user:id,name,email')->latest('created_at'),
            $request,
            'tam_surveys',
        );
    }

    private function renderList(string $page, string $title, $query, Request $request, string $listType): Response
    {
        $perPage = in_array((int) $request->input('per_page'), [10, 15, 25, 50]) ? (int) $request->input('per_page') : 15;

        $paginator = $query->paginate($perPage)->withQueryString();

        $items = match ($listType) {
            'tam_surveys' => $paginator->through(
                fn (TamSurvey $row) => AdminReadOnlyPresenter::tamSurvey($row),
            ),
            'recommendations' => $paginator->through(
                fn (Recommendation $row) => AdminReadOnlyPresenter::recommendation($row),
            ),
            'recommendation_requests' => $paginator->through(
                fn (RecommendationRequest $row) => AdminReadOnlyPresenter::recommendationRequest($row),
            ),
            'user_interactions' => $paginator->through(
                fn (UserInteraction $row) => AdminReadOnlyPresenter::userInteraction($row),
            ),
            default => $paginator,
        };

        return Inertia::render($page, [
            'title' => $title,
            'items' => $items,
            'listType' => $listType,
        ]);
    }
}
