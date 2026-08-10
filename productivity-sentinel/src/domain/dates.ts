import type { Millis } from '@cognitex/data';

/**
 * Calendar arithmetic, in local time, without date-fns.
 *
 * date-fns was 5 of the app's 7 runtime dependencies' worth of bundle for six
 * functions. These are those six.
 *
 * Everything works in the browser's local zone on purpose: a working day in
 * Quito ends at midnight in Quito, not at 19:00 when UTC rolls over, and
 * adherence is counted in working days. Day arithmetic goes through
 * `Date.setDate`, which steps a whole calendar day across a DST boundary
 * rather than adding 86 400 000 milliseconds and landing an hour off.
 */

export const DAY_MS = 86_400_000;

export function startOfDay(at: Millis): Millis {
    const date = new Date(at);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
}

/** `yyyy-mm-dd` in local time — the key adherence and the log group by. */
export function toDateKey(at: Millis): string {
    const date = new Date(at);
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

/** Local midnight for a `yyyy-mm-dd` key. Returns NaN for a malformed key. */
export function fromDateKey(key: string): Millis {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
    if (!match) return Number.NaN;
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
}

export function addDays(at: Millis, days: number): Millis {
    const date = new Date(at);
    date.setDate(date.getDate() + days);
    return date.getTime();
}

/** Monday, 00:00 local. ISO 8601 weeks — Sunday belongs to the week before. */
export function startOfWeek(at: Millis): Millis {
    const date = new Date(startOfDay(at));
    // getDay() is 0 for Sunday; ISO wants Sunday to count as day 7.
    const isoDay = date.getDay() === 0 ? 7 : date.getDay();
    return addDays(date.getTime(), 1 - isoDay);
}

/**
 * ISO 8601 week number, 1-53.
 *
 * The old app called `getWeek(date, { weekStartsOn: 1 })`, which is date-fns'
 * *locale* week, not the ISO week — it disagreed with ISO by one for any year
 * starting on a Friday, Saturday or Sunday, and the synthesis header is
 * labelled "Semana N" in reports people compare against a calendar.
 */
export function isoWeek(at: Millis): number {
    const local = new Date(at);
    // Work on a UTC copy of the local Y/M/D so the arithmetic cannot cross a
    // DST boundary halfway through.
    const utc = new Date(
        Date.UTC(local.getFullYear(), local.getMonth(), local.getDate())
    );
    const isoDay = utc.getUTCDay() === 0 ? 7 : utc.getUTCDay();
    // Shift to the Thursday of this week: the year that Thursday falls in is
    // the ISO week-numbering year, by definition.
    utc.setUTCDate(utc.getUTCDate() + 4 - isoDay);
    const yearStart = Date.UTC(utc.getUTCFullYear(), 0, 1);
    return Math.ceil(((utc.getTime() - yearStart) / DAY_MS + 1) / 7);
}

/** `dd/MM` — the axis and table format used throughout the console. */
export function shortDate(at: Millis): string {
    const date = new Date(at);
    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    return `${day}/${month}`;
}

/** Whole calendar days between two instants, ignoring the time of day. */
export function daysBetween(from: Millis, to: Millis): number {
    return Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS);
}
