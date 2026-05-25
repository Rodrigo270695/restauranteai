<?php

use App\Jobs\TrainMlRecommendationModels;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

if (config('recommendations.schedule_enabled', true)) {
    Schedule::job(new TrainMlRecommendationModels)
        ->cron((string) config('recommendations.schedule_cron', '0 3 * * 0'))
        ->timezone(config('app.timezone', 'UTC'))
        ->withoutOverlapping()
        ->name('ml-train-recommendations')
        ->onOneServer();
}
