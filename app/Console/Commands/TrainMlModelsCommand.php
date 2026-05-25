<?php

namespace App\Console\Commands;

use App\Jobs\TrainMlRecommendationModels;
use App\Services\MlTrainingService;
use Illuminate\Console\Command;

class TrainMlModelsCommand extends Command
{
    protected $signature = 'ml:train {--sync : Ejecutar en este proceso sin cola}';

    protected $description = 'Reentrena los modelos del microservicio ML de recomendaciones';

    public function handle(MlTrainingService $training): int
    {
        if ($this->option('sync')) {
            $run = $training->runSync();

            if ($run['status'] !== 'success') {
                $this->error($run['message']);

                return self::FAILURE;
            }

            $this->info($run['message']);
            $this->line(json_encode($run['result'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            return self::SUCCESS;
        }

        TrainMlRecommendationModels::dispatch();
        $this->info('Job de entrenamiento encolado.');

        return self::SUCCESS;
    }
}
