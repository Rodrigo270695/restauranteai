<?php

use App\Console\Commands\DeployCheckCommand;
use App\Jobs\TrainMlRecommendationModels;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('app:deploy-check', function () {
    $this->call(DeployCheckCommand::class);
})->purpose('Verifica código y rutas de galería en el servidor');

if (config('recommendations.schedule_enabled', true)) {
    Schedule::job(new TrainMlRecommendationModels)
        ->cron((string) config('recommendations.schedule_cron', '0 3 * * 0'))
        ->timezone(config('app.timezone', 'UTC'))
        ->withoutOverlapping()
        ->name('ml-train-recommendations')
        ->onOneServer();
}
