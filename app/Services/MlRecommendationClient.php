<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MlRecommendationClient
{
    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>|null
     */
    public function recommend(array $payload): ?array
    {
        if (! config('recommendations.use_ml_service')) {
            return null;
        }

        $url = rtrim((string) config('recommendations.ml_service_url'), '/').'/api/v1/recommend';

        try {
            $response = Http::timeout((int) config('recommendations.timeout_seconds'))
                ->withHeaders([
                    'X-API-Key' => (string) config('recommendations.ml_api_key'),
                    'Accept' => 'application/json',
                ])
                ->post($url, $payload);

            if (! $response->successful()) {
                Log::warning('ML recommend failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            return $response->json();
        } catch (ConnectionException $e) {
            Log::warning('ML service unreachable', ['message' => $e->getMessage()]);

            return null;
        }
    }

    public function isHealthy(): bool
    {
        try {
            $url = rtrim((string) config('recommendations.ml_service_url'), '/').'/api/v1/health';
            $response = Http::timeout(3)->get($url);

            return $response->successful() && ($response->json('status') === 'ok');
        } catch (ConnectionException) {
            return false;
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function feedback(array $payload): void
    {
        if (! config('recommendations.use_ml_service')) {
            return;
        }

        $url = rtrim((string) config('recommendations.ml_service_url'), '/').'/api/v1/feedback';

        try {
            Http::timeout(5)
                ->withHeaders([
                    'X-API-Key' => (string) config('recommendations.ml_api_key'),
                    'Accept' => 'application/json',
                ])
                ->post($url, $payload);
        } catch (ConnectionException $e) {
            Log::debug('ML feedback skipped', ['message' => $e->getMessage()]);
        }
    }

    /**
     * @return array<string, mixed>|null
     */
    public function train(): ?array
    {
        if (! config('recommendations.use_ml_service')) {
            return null;
        }

        $url = rtrim((string) config('recommendations.ml_service_url'), '/').'/api/v1/train';
        $timeout = (int) config('recommendations.train_timeout_seconds', 300);

        try {
            $response = Http::timeout($timeout)
                ->withHeaders([
                    'X-API-Key' => (string) config('recommendations.ml_api_key'),
                    'Accept' => 'application/json',
                ])
                ->post($url);

            if (! $response->successful()) {
                Log::warning('ML train failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            return $response->json();
        } catch (ConnectionException $e) {
            Log::warning('ML train unreachable', ['message' => $e->getMessage()]);

            return null;
        }
    }
}
