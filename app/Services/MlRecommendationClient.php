<?php

namespace App\Services;

use App\Support\RecsDebugLog;
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
        if (! $this->isEnabled()) {
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
                RecsDebugLog::warning('http_failed', [
                    'status' => $response->status(),
                    'body' => mb_substr($response->body(), 0, 2000),
                    'url' => $url,
                ]);

                return null;
            }

            RecsDebugLog::info('http_ok', [
                'url' => $url,
                'status' => $response->status(),
            ]);

            return $response->json();
        } catch (ConnectionException $e) {
            RecsDebugLog::warning('http_unreachable', [
                'url' => $url,
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    public function isHealthy(): bool
    {
        if (! $this->isEnabled()) {
            return false;
        }

        try {
            $url = rtrim((string) config('recommendations.ml_service_url'), '/').'/api/v1/health';
            $response = Http::timeout(3)->get($url);
            $ok = $response->successful() && ($response->json('status') === 'ok');

            RecsDebugLog::info('health', [
                'url' => $url,
                'status' => $response->status(),
                'body' => $response->json(),
                'ok' => $ok,
            ]);

            return $ok;
        } catch (ConnectionException $e) {
            RecsDebugLog::warning('health_unreachable', ['message' => $e->getMessage()]);

            return false;
        }
    }

    public function isEnabled(): bool
    {
        return (bool) config('recommendations.use_ml_service');
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function feedback(array $payload): void
    {
        if (! $this->isEnabled()) {
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
        if (! $this->isEnabled()) {
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
