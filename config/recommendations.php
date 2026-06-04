<?php

return [
    'ml_service_url' => env('ML_SERVICE_URL', 'http://127.0.0.1:8001'),
    'ml_api_key' => env('ML_SERVICE_API_KEY', 'local-dev-ml-key-change-me'),
    'timeout_seconds' => (int) env('ML_SERVICE_TIMEOUT', 15),
    'cache_ttl_seconds' => (int) env('ML_RECOMMENDATIONS_CACHE_TTL', 600),
    'default_top_n' => (int) env('ML_DEFAULT_TOP_N', 10),
    'use_ml_service' => env('ML_SERVICE_ENABLED', true),
    'train_timeout_seconds' => (int) env('ML_SERVICE_TRAIN_TIMEOUT', 300),
    'schedule_enabled' => env('ML_TRAIN_SCHEDULE_ENABLED', true),
    'schedule_cron' => env('ML_TRAIN_SCHEDULE_CRON', '0 3 * * 0'),
];
