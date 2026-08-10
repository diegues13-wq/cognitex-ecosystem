import type { Millis } from '@cognitex/data';
import type { SeriesPoint } from '@cognitex/ui';

import { DAY_MS, addDays, startOfDay } from './dates';
import type { FailureEntry, RootCause } from './types';

/**
 * Recurrence — the headline KPI — derived instead of stored.
 *
 * This is the largest behavioural change in the rewrite. `es_recurrente` used
 * to be a field: the generator set it from `rng() < threshold` and the entry
 * form hardcoded `es_recurrente: false` for everything a real user typed. So
 * the number the console called "KPI principal" was a random variable for
 * demo rows and a constant zero for real ones, and nothing in the app could
 * have made it agree with the log it sat next to.
 *
 * A failure is recurrent when its root cause was already logged within the
 * preceding window. That is checkable against the log, it changes when the
 * user's behaviour changes, and it is the definition the product claims.
 */

export const DEFAULT_WINDOW_DAYS = 14;

export interface RecurrentEntry extends FailureEntry {
    recurring: boolean;
    /** When this cause was last seen before this entry. Null on first sight. */
    previousAt: Millis | null;
    /** Whole days since that previous occurrence. Null on first sight. */
    daysSincePrevious: number | null;
}

/**
 * Flags each entry, oldest first.
 *
 * Returned in ascending time order regardless of input order, because
 * recurrence is only meaningful as a sequence and callers kept re-sorting it.
 */
export function detectRecurrence(
    entries: readonly FailureEntry[],
    windowDays: number = DEFAULT_WINDOW_DAYS
): RecurrentEntry[] {
    const windowMs = windowDays * DAY_MS;
    const ordered = [...entries].sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
    const lastSeen = new Map<RootCause, Millis>();

    return ordered.map((entry) => {
        const previousAt = lastSeen.get(entry.rootCause) ?? null;
        const withinWindow = previousAt !== null && entry.at - previousAt <= windowMs;
        lastSeen.set(entry.rootCause, entry.at);

        return {
            ...entry,
            recurring: withinWindow,
            previousAt: withinWindow ? previousAt : null,
            daysSincePrevious:
                withinWindow && previousAt !== null
                    ? Math.round((startOfDay(entry.at) - startOfDay(previousAt)) / DAY_MS)
                    : null,
        };
    });
}

/** Share of entries that were recurrent, 0-100. Zero entries give zero. */
export function recurrenceRate(
    entries: readonly FailureEntry[],
    windowDays: number = DEFAULT_WINDOW_DAYS
): number {
    if (entries.length === 0) return 0;
    const flagged = detectRecurrence(entries, windowDays);
    const recurring = flagged.filter((entry) => entry.recurring).length;
    return (recurring / flagged.length) * 100;
}

/**
 * Trailing recurrence rate, one point per day.
 *
 * Days whose trailing window holds no entries produce no point at all. The
 * previous version emitted zero for them, which drew the KPI falling to its
 * best possible value on exactly the days nobody used the system.
 */
export function recurrenceTrend(
    entries: readonly FailureEntry[],
    options: {
        /** How many days the trend covers. */
        days: number;
        /** Width of the trailing average, in days. */
        trailingDays?: number;
        /** How far back a cause counts as already seen. */
        windowDays?: number;
        now: Millis;
    }
): SeriesPoint[] {
    const trailing = options.trailingDays ?? 7;
    const flagged = detectRecurrence(entries, options.windowDays ?? DEFAULT_WINDOW_DAYS);
    const points: SeriesPoint[] = [];

    for (let offset = options.days - 1; offset >= 0; offset -= 1) {
        const dayEnd = startOfDay(addDays(options.now, -offset)) + DAY_MS - 1;
        const windowStart = startOfDay(addDays(dayEnd, -(trailing - 1)));

        let total = 0;
        let recurring = 0;
        for (const entry of flagged) {
            if (entry.at < windowStart || entry.at > dayEnd) continue;
            total += 1;
            if (entry.recurring) recurring += 1;
        }

        if (total === 0) continue;
        points.push({ at: dayEnd, value: (recurring / total) * 100 });
    }

    return points;
}

/**
 * Causes that keep coming back, most persistent first.
 *
 * Answers a different question from the Pareto: not "what fails most" but
 * "what did we already try to fix and see again".
 */
export interface RepeatOffender {
    cause: RootCause;
    occurrences: number;
    repeats: number;
    /** Whole days between the two most recent occurrences. Null if only one. */
    lastGapDays: number | null;
}

export function repeatOffenders(
    entries: readonly FailureEntry[],
    windowDays: number = DEFAULT_WINDOW_DAYS
): RepeatOffender[] {
    const flagged = detectRecurrence(entries, windowDays);
    const byCause = new Map<RootCause, RepeatOffender>();

    for (const entry of flagged) {
        const current = byCause.get(entry.rootCause) ?? {
            cause: entry.rootCause,
            occurrences: 0,
            repeats: 0,
            lastGapDays: null,
        };

        current.occurrences += 1;
        if (entry.recurring) {
            current.repeats += 1;
            current.lastGapDays = entry.daysSincePrevious;
        }
        byCause.set(entry.rootCause, current);
    }

    return [...byCause.values()]
        .filter((offender) => offender.repeats > 0)
        .sort((a, b) => b.repeats - a.repeats || a.cause.localeCompare(b.cause));
}
