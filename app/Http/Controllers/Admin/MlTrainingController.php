<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MlTrainingRun;
use App\Services\MlTrainingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MlTrainingController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->hasRole('super_admin'), 403);

        $search = $request->string('search')->trim()->value();
        $status = $request->string('status')->trim()->value();
        $perPage = in_array((int) $request->input('per_page'), [10, 15, 25, 50], true)
            ? (int) $request->input('per_page')
            : 15;

        $sortable = ['id', 'status', 'started_at', 'finished_at', 'duration_seconds', 'triggered_by_name'];
        $sortKey = in_array($request->input('sort'), $sortable, true) ? $request->input('sort') : 'started_at';
        $sortDir = $request->input('dir') === 'asc' ? 'asc' : 'desc';

        $statusValid = in_array($status, ['success', 'failed'], true);

        $runs = MlTrainingRun::query()
            ->with('triggeredBy:id,name,email')
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($q) use ($search) {
                    $q->where('message', 'like', "%{$search}%")
                        ->orWhere('triggered_by_name', 'like', "%{$search}%")
                        ->orWhereHas('triggeredBy', fn ($u) => $u
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%"));
                });
            })
            ->when($statusValid, fn ($q) => $q->where('status', $status))
            ->orderBy($sortKey, $sortDir)
            ->paginate($perPage)
            ->withQueryString();

        $successCount = MlTrainingRun::query()->where('status', 'success')->count();
        $failedCount = MlTrainingRun::query()->where('status', 'failed')->count();
        $lastRun = MlTrainingRun::query()->latest('finished_at')->first();

        return Inertia::render('app/admin/ml-training', [
            'runs' => $runs->through(fn (MlTrainingRun $run) => $this->formatRun($run)),
            'filters' => [
                'search' => $search,
                'sort' => $sortKey,
                'dir' => $sortDir,
                'status' => $statusValid ? $status : '',
            ],
            'stats' => [
                'totalRuns' => MlTrainingRun::count(),
                'successCount' => $successCount,
                'failedCount' => $failedCount,
                'currentPage' => $runs->currentPage(),
                'lastPage' => $runs->lastPage(),
                'onPage' => $runs->count(),
                'lastRunAt' => $lastRun?->finished_at?->format('d/m/Y H:i') ?? '—',
            ],
            'canTrainMl' => $request->user()?->can('ml_training.run') ?? false,
        ]);
    }

    public function store(Request $request, MlTrainingService $training): RedirectResponse
    {
        abort_unless($request->user()?->hasRole('super_admin'), 403);

        $run = $training->runSync($request->user());

        $flashKey = $run->status === 'success' ? 'success' : 'error';

        return redirect()
            ->route('app.admin.ml-training.index')
            ->with($flashKey, $run->message);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatRun(MlTrainingRun $run): array
    {
        return [
            'id' => $run->id,
            'status' => $run->status,
            'message' => $run->message,
            'started_at' => $run->started_at->toIso8601String(),
            'finished_at' => $run->finished_at->toIso8601String(),
            'started_at_display' => $run->started_at->format('d/m/Y H:i:s'),
            'finished_at_display' => $run->finished_at->format('d/m/Y H:i:s'),
            'duration_seconds' => $run->duration_seconds,
            'result' => $run->result,
            'triggered_by_name' => $run->triggered_by_name,
            'triggered_by_email' => $run->triggeredBy?->email,
        ];
    }
}
