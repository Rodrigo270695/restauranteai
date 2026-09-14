<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;

class RecsDebugLog
{
    /** @param  array<string, mixed>  $context */
    public static function info(string $event, array $context = []): void
    {
        $payload = ['event' => $event, ...$context];

        Log::channel('recs')->info('[RECS] '.$event, $payload);
        Log::info('[RECS] '.$event, $payload);
    }

    /** @param  array<string, mixed>  $context */
    public static function warning(string $event, array $context = []): void
    {
        $payload = ['event' => $event, ...$context];

        Log::channel('recs')->warning('[RECS] '.$event, $payload);
        Log::warning('[RECS] '.$event, $payload);
    }
}
