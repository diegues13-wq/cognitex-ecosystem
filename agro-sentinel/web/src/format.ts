import type { Channel, Millis } from './domain';

/**
 * Presentation, in one place.
 *
 * Times are rendered in `America/Guayaquil` explicitly rather than in the
 * browser's zone. The farms are all in Ecuador; an agronomist reviewing a
 * Cayambe night from Madrid needs the hour the reading was taken, not the
 * hour it was in Madrid. The old console formatted with `date-fns` in local
 * time and the histogram of "alarms by hour" was wrong for anyone travelling.
 */

const FARM_ZONE = 'America/Guayaquil';

const TIME = new Intl.DateTimeFormat('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: FARM_ZONE,
});

const DATE_TIME = new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: FARM_ZONE,
});

const DATE = new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    timeZone: FARM_ZONE,
});

export function formatTime(at: Millis): string {
    return TIME.format(at);
}

export function formatDateTime(at: Millis): string {
    return DATE_TIME.format(at);
}

export function formatDate(at: Millis): string {
    return DATE.format(at);
}

/**
 * A measurement with its unit.
 *
 * `Number.isFinite`, not a truthiness test: PAR is 0 all night and a soil
 * probe can read 0%. Every KPI card in the old console rendered `value ||
 * '--'`, so the one reading that most needs attention displayed as no data.
 */
export function formatValue(value: number | null | undefined, channel: Channel): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '—';

    return `${value.toFixed(channel.precision)} ${channel.unit}`;
}

/** How long ago, in words. Takes `now` so a render stays reproducible. */
export function formatAge(at: Millis, now: Millis): string {
    const minutes = Math.max(0, Math.round((now - at) / 60_000));
    if (minutes < 1) return 'hace instantes';
    if (minutes < 60) return `hace ${minutes} min`;

    const hours = Math.round(minutes / 60);
    if (hours < 24) return `hace ${hours} h`;

    return `hace ${Math.round(hours / 24)} d`;
}
