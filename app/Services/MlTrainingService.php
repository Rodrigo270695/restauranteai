<?php

namespace App\Services;

use App\Models\MlTrainingRun;
use App\Models\User;

class MlTrainingService
{
    public function __construct(
        private MlRecommendationClient $client,
    ) {}

    public function runSync(?User $triggeredBy = null): MlTrainingRun
    {
        $started = now();

        if (! config('recommendations.use_ml_service')) {
            return $this->persistRun(
                $started,
                now(),
                'failed',
                'Servicio ML desactivado (ML_SERVICE_ENABLED=false).',
                null,
                $triggeredBy,
            );
        }

        $result = $this->client->train();
        $finished = now();

        if ($result === null) {
            return $this->persistRun(
                $started,
                $finished,
                'failed',
                'No se pudo contactar al servicio ML. ¿Está uvicorn en el puerto 8001?',
                null,
                $triggeredBy,
            );
        }

        return $this->persistRun(
            $started,
            $finished,
            'success',
            'Entrenamiento completado.',
            $result,
            $triggeredBy,
        );
    }

    /**
     * @param  array<string, mixed>|null  $result
     */
    private function persistRun(
        \DateTimeInterface $started,
        \DateTimeInterface $finished,
        string $status,
        string $message,
        ?array $result,
        ?User $triggeredBy,
    ): MlTrainingRun {
        return MlTrainingRun::query()->create([
            'status' => $status,
            'message' => $message,
            'started_at' => $started,
            'finished_at' => $finished,
            'duration_seconds' => max(0, $finished->getTimestamp() - $started->getTimestamp()),
            'result' => $result,
            'triggered_by_user_id' => $triggeredBy?->id,
            'triggered_by_name' => $triggeredBy?->name ?? 'Sistema',
        ]);
    }
}
