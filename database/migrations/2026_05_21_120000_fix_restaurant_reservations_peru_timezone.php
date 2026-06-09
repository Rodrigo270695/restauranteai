<?php

use App\Models\RestaurantReservation;
use App\Support\PeruDateTime;
use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** Corrige reservas guardadas con hora peruana interpretada como UTC. */
    public function up(): void
    {
        RestaurantReservation::query()
            ->orderBy('id')
            ->each(function (RestaurantReservation $reservation): void {
                $raw = $reservation->getRawOriginal('reserved_for');

                if (! is_string($raw) || $raw === '') {
                    return;
                }

                $storedUtc = Carbon::parse($raw, 'UTC');
                $intendedLima = Carbon::createFromFormat('Y-m-d H:i:s', $raw, PeruDateTime::TZ);
                $displayLima = $storedUtc->copy()->timezone(PeruDateTime::TZ);

                $wasStoredAsLocalLiteral = $storedUtc->format('Y-m-d H:i:s') === $raw
                    && $intendedLima->format('Y-m-d') === $displayLima->format('Y-m-d')
                    && $intendedLima->format('H:i:s') !== $displayLima->format('H:i:s');

                if (! $wasStoredAsLocalLiteral) {
                    return;
                }

                DB::table('restaurant_reservations')
                    ->where('id', $reservation->id)
                    ->update([
                        'reserved_for' => $intendedLima->copy()->utc()->format('Y-m-d H:i:s'),
                    ]);
            });
    }

    public function down(): void
    {
        // No reversible de forma segura.
    }
};
