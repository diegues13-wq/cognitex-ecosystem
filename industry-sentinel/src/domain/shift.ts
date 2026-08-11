import type { Millis } from '@cognitex/data';

import type { Shift } from './types';

export const HOUR_MS = 3_600_000;
export const DAY_MS = 86_400_000;

/**
 * Whether an instant falls inside the scheduled production window.
 *
 * Local hours, deliberately: a plant's shift is a wall-clock fact, and the
 * console is read by the people standing next to the machine.
 *
 * A window that wraps midnight (`22:00`–`06:00`) is handled, because a night
 * shift is a normal thing for a plant to run even though this one does not.
 */
export function isScheduled(at: Millis, shift: Shift): boolean {
    const hour = new Date(at).getHours();

    if (shift.startHour === shift.endHour) return false;
    if (shift.startHour < shift.endHour) {
        return hour >= shift.startHour && hour < shift.endHour;
    }
    return hour >= shift.startHour || hour < shift.endHour;
}

/** Scheduled hours per day, for turning a sample count into a duration. */
export function shiftHours(shift: Shift): number {
    if (shift.startHour === shift.endHour) return 0;
    if (shift.startHour < shift.endHour) return shift.endHour - shift.startHour;
    return 24 - shift.startHour + shift.endHour;
}

/** Midnight local at the start of the day containing `at`. */
export function startOfDay(at: Millis): Millis {
    const date = new Date(at);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
}

/** `dd/MM HH:mm`, the density a control-room table wants. */
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
 * Never "0" on its own: a stop of under a minute still happened, so it reads
 * "<1 min" rather than collapsing to a zero that looks like missing data.
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
