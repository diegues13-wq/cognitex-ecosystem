import type { Millis } from '@cognitex/data';

import { addDays, isoWeek, startOfWeek, toDateKey } from './dates';
import type { FailureEntry } from './types';

/**
 * Plan Percent Complete and the two process indicators around it.
 *
 * PPC is the Last Planner measure: of the commitments that came due, how many
 * were completed. Two things here differ from what the app did before, and
 * both change the number the customer sees:
 *
 *  1. **PPC is binary.** A commitment is complete or it is not. The old
 *     implementation counted `parcial` as implemented, which inflated the
 *     headline figure by however many half-done adjustments there were — in
 *     the seeded data, about eleven points. Partials are still counted and
 *     shown, just not as completions.
 *  2. **Pending is excluded, not failed.** `pendiente` means the verification
 *     has not happened yet. The old code filtered on `e.ajuste` only, so every
 *     unverified commitment counted against the rate the moment it was
 *     written — a user logging an entry watched their score drop for it.
 */

export interface PpcResult {
    /** Commitments whose verification came due. The denominator. */
    planned: number;
    completed: number;
    partial: number;
    failed: number;
    /** Written but not yet verified. Excluded from the ratio on purpose. */
    pending: number;
    /**
     * 0-100. Zero when nothing came due — check `planned` before reading it,
     * because "no commitments" and "no commitments met" are different facts.
     */
    ppc: number;
}

const EMPTY: PpcResult = {
    planned: 0,
    completed: 0,
    partial: 0,
    failed: 0,
    pending: 0,
    ppc: 0,
};

export function computePpc(entries: readonly FailureEntry[]): PpcResult {
    let completed = 0;
    let partial = 0;
    let failed = 0;
    let pending = 0;

    for (const entry of entries) {
        switch (entry.adjustmentStatus) {
            case 'si':
                completed += 1;
                break;
            case 'parcial':
                partial += 1;
                break;
            case 'no':
                failed += 1;
                break;
            case 'pendiente':
                pending += 1;
                break;
        }
    }

    const planned = completed + partial + failed;
    if (planned === 0) return { ...EMPTY, pending };

    return {
        planned,
        completed,
        partial,
        failed,
        pending,
        ppc: (completed / planned) * 100,
    };
}

/**
 * How much of a commitment got done, counting partials at half.
 *
 * Kept separate from PPC deliberately: PPC is the reported, auditable figure
 * and it stays binary. This is the softer view a person uses to see that a
 * bad week was half-effort rather than no effort.
 */
export function implementationRate(entries: readonly FailureEntry[]): number {
    const { planned, completed, partial } = computePpc(entries);
    if (planned === 0) return 0;
    return ((completed + partial * 0.5) / planned) * 100;
}

export interface WeeklyPpc {
    /** Monday 00:00 local of the week. */
    weekStart: Millis;
    weekNumber: number;
    entries: number;
    result: PpcResult;
}

/**
 * PPC per ISO week, oldest first, including weeks with no entries.
 *
 * Empty weeks are kept rather than dropped: a gap in the log is itself the
 * signal that the loop stopped running, and a chart that silently closes the
 * gap hides it.
 */
export function weeklyPpc(
    entries: readonly FailureEntry[],
    options: { weeks: number; now: Millis }
): WeeklyPpc[] {
    const buckets = new Map<Millis, FailureEntry[]>();
    const thisWeek = startOfWeek(options.now);

    const starts: Millis[] = [];
    for (let index = options.weeks - 1; index >= 0; index -= 1) {
        const start = addDays(thisWeek, -7 * index);
        starts.push(start);
        buckets.set(start, []);
    }

    const oldest = starts[0] ?? thisWeek;
    for (const entry of entries) {
        if (entry.at < oldest) continue;
        const bucket = buckets.get(startOfWeek(entry.at));
        if (bucket) bucket.push(entry);
    }

    return starts.map((weekStart) => {
        const bucket = buckets.get(weekStart) ?? [];
        return {
            weekStart,
            weekNumber: isoWeek(weekStart),
            entries: bucket.length,
            result: computePpc(bucket),
        };
    });
}

export interface Adherence {
    /** Distinct calendar days with at least one entry. */
    daysLogged: number;
    /** Length of the window in days. */
    days: number;
    /** 0-100. */
    rate: number;
    /** Consecutive days ending today (or yesterday) with an entry. */
    streak: number;
}

/**
 * Whether the loop is being run at all.
 *
 * A process indicator, not an outcome: it answers "is anyone using this",
 * which is the first thing to check when every other number looks fine.
 */
export function adherence(
    entries: readonly FailureEntry[],
    options: { days: number; now: Millis }
): Adherence {
    const window = new Set<string>();
    const earliest = addDays(options.now, -(options.days - 1));

    for (const entry of entries) {
        if (entry.at < earliest) continue;
        if (entry.at > options.now) continue;
        window.add(entry.date);
    }

    // The streak may legitimately end yesterday — a day is not a missed day
    // until it is over, so today counting as a break would punish anyone
    // opening the console before they have logged.
    let streak = 0;
    let cursor = options.now;
    if (!window.has(toDateKey(cursor))) cursor = addDays(cursor, -1);
    while (window.has(toDateKey(cursor))) {
        streak += 1;
        cursor = addDays(cursor, -1);
    }

    return {
        daysLogged: window.size,
        days: options.days,
        rate: options.days === 0 ? 0 : (window.size / options.days) * 100,
        streak,
    };
}
