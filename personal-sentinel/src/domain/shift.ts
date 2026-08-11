import type { Millis } from '@cognitex/data';

import type { Shift } from './types';

export const HOUR_MS = 3_600_000;

/**
 * Whether an instant falls inside the scheduled shift.
 *
 * Local hours, deliberately: a shift is a wall-clock fact, and the console is
 * read by the supervisor standing on the same site.
 *
 * Half-open, `[start, end)`. The generator this replaces tested `hour >= 8 &&
 * hour <= 17`, which counts the whole of the 17:00 hour and makes the shift
 * ten hours long — so fatigue, which climbs with hours on shift, was scaled
 * against a working day nobody works.
 */
export function isOnShift(at: Millis, shift: Shift): boolean {
    const hour = new Date(at).getHours();

    if (shift.startHour === shift.endHour) return false;
    if (shift.startHour < shift.endHour) {
        return hour >= shift.startHour && hour < shift.endHour;
    }
    return hour >= shift.startHour || hour < shift.endHour;
}

export function shiftHours(shift: Shift): number {
    if (shift.startHour === shift.endHour) return 0;
    if (shift.startHour < shift.endHour) return shift.endHour - shift.startHour;
    return 24 - shift.startHour + shift.endHour;
}

/**
 * Hours elapsed since the shift began, or zero off shift.
 *
 * Fractional, because fatigue at 08:30 is not the same as fatigue at 08:00 and
 * a whole-hour step makes the score jump on the hour.
 */
export function hoursOnShift(at: Millis, shift: Shift): number {
    if (!isOnShift(at, shift)) return 0;

    const date = new Date(at);
    const hour = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
    const elapsed = hour - shift.startHour;

    // A window that wraps midnight puts the small hours after the start.
    return elapsed >= 0 ? elapsed : elapsed + 24;
}

export function startOfDay(at: Millis): Millis {
    const date = new Date(at);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
}

/** `dd/MM HH:mm`, the density a supervisor's table wants. */
export function shortStamp(at: Millis): string {
    return new Date(at).toLocaleString('es-EC', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * A duration as hours and minutes.
 *
 * Never a bare "0": a fall that lasted forty seconds still happened, so it
 * reads "<1 min" rather than collapsing into something that looks like
 * missing data.
 */
export function formatDuration(ms: number): string {
    if (!Number.isFinite(ms) || ms < 0) return '—';

    const minutes = Math.floor(ms / 60_000);
    if (minutes < 1) return '<1 min';
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
