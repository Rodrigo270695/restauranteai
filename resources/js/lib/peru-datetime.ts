/** Zona horaria oficial para reservas y rutas turísticas (Perú). */
export const PERU_TZ = 'America/Lima';

export function peruLocale(language: string): string {
    return language === 'en' ? 'en-US' : 'es-PE';
}

function zonedParts(date: Date, timeZone: string) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(date);

    const get = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find(p => p.type === type)?.value ?? '00';

    return {
        year: get('year'),
        month: get('month'),
        day: get('day'),
        hour: get('hour'),
        minute: get('minute'),
    };
}

/** Valor inicial para `<input type="datetime-local">` (hora de Lima, +2 h redondeadas). */
export function defaultPeruDateTimeLocal(): string {
    const now = zonedParts(new Date(), PERU_TZ);
    let hour = parseInt(now.hour, 10) + 2;
    let { year, month, day } = now;

    if (hour >= 24) {
        hour -= 24;
        const anchor = new Date(`${year}-${month}-${day}T12:00:00-05:00`);
        anchor.setUTCDate(anchor.getUTCDate() + 1);
        const next = zonedParts(anchor, PERU_TZ);
        year = next.year;
        month = next.month;
        day = next.day;
    }

    return `${year}-${month}-${day}T${String(hour).padStart(2, '0')}:00`;
}

/** Convierte ISO del backend a Date interpretando siempre America/Lima. */
export function parsePeruIso(iso: string): Date {
    if (/[zZ]$/.test(iso) || /[+-]\d{2}:\d{2}$/.test(iso)) {
        return new Date(iso);
    }

    return new Date(`${iso.replace(' ', 'T')}-05:00`);
}

/** Reserva confirmada / tarjeta activa: fecha mediana + hora corta (Lima). */
export function formatPeruDateTimeMedium(iso: string, locale = 'es-PE'): string {
    return new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: PERU_TZ,
    }).format(parsePeruIso(iso));
}

/** Detalle de parada visitada: día abreviado + fecha + hora (Lima). */
export function formatPeruReservationDateTime(iso: string, locale = 'es-PE'): string {
    return new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: PERU_TZ,
    }).format(parsePeruIso(iso));
}

/** Hora de salida / visita compacta (Lima). */
export function formatPeruDateTimeShort(iso: string, locale = 'es-PE'): string {
    return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: PERU_TZ,
    }).format(parsePeruIso(iso));
}

/** Solo fecha de ruta (YYYY-MM-DD o ISO). */
export function formatPeruDateOnly(dateStr: string, locale = 'es-PE'): string {
    const iso = dateStr.length === 10 ? `${dateStr}T12:00:00-05:00` : dateStr;

    return new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: PERU_TZ,
    }).format(parsePeruIso(iso));
}
