<?php

namespace App\Support;

use App\Models\Restaurant;
use App\Models\RestaurantSchedule;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

final class RestaurantHoursPresenter
{
    public const TZ = 'America/Lima';

    public const CLOSING_SOON_MINUTES = 30;

    /** @return array<string, mixed> */
    public function forRestaurant(Restaurant $restaurant, ?CarbonInterface $now = null): array
    {
        $restaurant->loadMissing('schedules');

        return $this->forSchedules($restaurant->schedules, $now);
    }

    /**
     * @param  Collection<int, RestaurantSchedule>  $schedules
     * @return array{
     *     is_open: bool,
     *     label: string,
     *     closes_soon: bool,
     *     minutes_until_close: int|null,
     *     opens_at_label: string|null,
     *     closes_at_label: string|null,
     * }
     */
    public function isOpen(Restaurant $restaurant, ?CarbonInterface $now = null): bool
    {
        $restaurant->loadMissing('schedules');

        if ($restaurant->schedules->isEmpty()) {
            return true;
        }

        return $this->forRestaurant($restaurant, $now)['is_open'] === true;
    }

    /** Coincide con la UI: abiertos ahora o sin horario publicado (se pueden agregar a la ruta). */
    public function isAvailableForRouteNow(Restaurant $restaurant, ?CarbonInterface $now = null): bool
    {
        $restaurant->loadMissing('schedules');
        $status = $this->forSchedules($restaurant->schedules, $now);

        return $status['is_open'] || $status['label'] === 'Horario no disponible';
    }

    public function assertOpenForVisit(Restaurant $restaurant, ?CarbonInterface $now = null): void
    {
        $this->assertOpenAt($restaurant, $now, 'restaurant', forRoute: true);
    }

    public function assertOpenAt(
        Restaurant $restaurant,
        ?CarbonInterface $when = null,
        string $field = 'reserved_for',
        bool $forRoute = false,
    ): void {
        $restaurant->loadMissing('schedules');

        if ($restaurant->schedules->isEmpty()) {
            return;
        }

        $status = $this->forRestaurant($restaurant, $when);

        if ($status['is_open']) {
            return;
        }

        $detail = $status['label'] ?? 'Cerrado';
        $message = $forRoute
            ? (str_starts_with($detail, 'Abre')
                ? $detail.'. No puedes agregarlo a tu ruta en este momento.'
                : 'Este local está cerrado ('.$detail.').')
            : 'El local estará cerrado a esa hora ('.$detail.').';

        throw ValidationException::withMessages([$field => $message]);
    }

    public function forSchedules(Collection $schedules, ?CarbonInterface $now = null): array
    {
        $now = Carbon::parse($now ?? now())->timezone(self::TZ);

        if ($schedules->isEmpty()) {
            return $this->unknown();
        }

        $byDay = $schedules->keyBy('day_of_week');
        $dow = $now->isoWeekday() - 1;
        $today = $byDay->get($dow);

        if (! $today || $today->is_closed || ! $today->opens_at || ! $today->closes_at) {
            $next = $this->nextOpenWindow($byDay, $now);

            return $this->closed(
                $next
                    ? 'Abre '.$next['weekday'].' a las '.$next['opens_at_label']
                    : 'Cerrado hoy',
            );
        }

        $opens = $this->timeOnDate((string) $today->opens_at, $now);
        $closes = $this->timeOnDate((string) $today->closes_at, $now);
        $overnight = $closes->lessThanOrEqualTo($opens);

        if ($overnight) {
            $closesEnd = $closes->copy()->addDay();
        } else {
            $closesEnd = $closes;
        }

        $isOpen = $overnight
            ? $now->gte($opens) || $now->lt($closes)
            : $now->gte($opens) && $now->lt($closesEnd);

        if (! $isOpen) {
            if ($now->lt($opens)) {
                return $this->closed('Abre a las '.$this->formatTimeLabel($opens));
            }

            $next = $this->nextOpenWindow($byDay, $now);

            return $this->closed(
                $next
                    ? 'Abre '.$next['weekday'].' a las '.$next['opens_at_label']
                    : 'Cerrado',
            );
        }

        $minutesUntilClose = $overnight && $now->gte($opens)
            ? (int) $now->diffInMinutes($closesEnd, false)
            : (int) $now->diffInMinutes($closesEnd, false);

        $minutesUntilClose = max(0, $minutesUntilClose);
        $closesLabel = $this->formatTimeLabel($closes);
        $closesSoon = $minutesUntilClose <= self::CLOSING_SOON_MINUTES;

        if ($closesSoon) {
            $label = $minutesUntilClose <= 1
                ? 'Cierra en 1 minuto'
                : 'Cierra en '.$minutesUntilClose.' minutos';
        } else {
            $label = 'Abierto hasta las '.$closesLabel;
        }

        return [
            'is_open' => true,
            'label' => $label,
            'closes_soon' => $closesSoon,
            'minutes_until_close' => $minutesUntilClose,
            'opens_at_label' => $this->formatTimeLabel($opens),
            'closes_at_label' => $closesLabel,
        ];
    }

    /** @return array<string, mixed> */
    private function unknown(): array
    {
        return [
            'is_open' => false,
            'label' => 'Horario no disponible',
            'closes_soon' => false,
            'minutes_until_close' => null,
            'opens_at_label' => null,
            'closes_at_label' => null,
        ];
    }

    /** @return array<string, mixed> */
    private function closed(string $label): array
    {
        return [
            'is_open' => false,
            'label' => $label,
            'closes_soon' => false,
            'minutes_until_close' => null,
            'opens_at_label' => null,
            'closes_at_label' => null,
        ];
    }

    private function timeOnDate(string $time, Carbon $date): Carbon
    {
        $parts = explode(':', substr($time, 0, 5));

        return $date->copy()->setTime((int) ($parts[0] ?? 0), (int) ($parts[1] ?? 0), 0);
    }

    private function formatTimeLabel(Carbon $time): string
    {
        $hour = (int) $time->format('G');
        $minute = $time->format('i');
        $period = $hour < 12 ? 'a. m.' : 'p. m.';
        $displayHour = $hour % 12 ?: 12;

        return $displayHour.':'.$minute.' '.$period;
    }

    /**
     * @param  Collection<int, RestaurantSchedule>  $byDay
     * @return array{weekday: string, opens_at_label: string}|null
     */
    private function nextOpenWindow(Collection $byDay, Carbon $now): ?array
    {
        $weekdays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
        $startDow = $now->isoWeekday() - 1;

        for ($offset = 1; $offset <= 7; $offset++) {
            $dow = ($startDow + $offset) % 7;
            $row = $byDay->get($dow);

            if (! $row || $row->is_closed || ! $row->opens_at) {
                continue;
            }

            return [
                'weekday' => $offset === 1 ? 'mañana' : 'el '.$weekdays[$dow],
                'opens_at_label' => $this->formatTimeLabel($this->timeOnDate((string) $row->opens_at, $now)),
            ];
        }

        return null;
    }
}
