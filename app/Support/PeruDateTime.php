<?php

namespace App\Support;

use Carbon\Carbon;
use Carbon\CarbonInterface;
use InvalidArgumentException;

/** Fechas de reservas turísticas siempre en hora de Perú (America/Lima). */
final class PeruDateTime
{
    public const TZ = RestaurantHoursPresenter::TZ;

    /** Interpreta el valor de `<input type="datetime-local">` como hora peruana. */
    public static function fromLocalInput(string $value): Carbon
    {
        $normalized = trim(str_replace('T', ' ', $value));

        if ($normalized === '') {
            throw new InvalidArgumentException('Fecha y hora de reserva vacía.');
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/', $normalized)) {
            $normalized .= ':00';
        }

        return Carbon::createFromFormat('Y-m-d H:i:s', $normalized, self::TZ);
    }

    /** Serializa para el frontend con offset de Lima (-05:00). */
    public static function toClientIso(?CarbonInterface $dateTime): ?string
    {
        if ($dateTime === null) {
            return null;
        }

        return $dateTime->copy()->timezone(self::TZ)->toIso8601String();
    }

    /** Valor listo para persistir en BD (UTC, instante correcto). */
    public static function forDatabase(CarbonInterface $dateTime): Carbon
    {
        return $dateTime->copy()->timezone(self::TZ)->utc();
    }
}
