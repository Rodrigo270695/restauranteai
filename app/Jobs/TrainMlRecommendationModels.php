<?php

namespace App\Jobs;

use App\Services\MlTrainingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class TrainMlRecommendationModels implements ShouldQueue
{
    use Queueable;

    public int $timeout = 600;

    public function handle(MlTrainingService $training): void
    {
        $run = $training->runSync();

        if ($run['status'] !== 'success') {
            Log::error('ML model training failed', ['message' => $run['message']]);

            return;
        }

        Log::info('ML model training completed', ['result' => $run['result']]);
    }
}
