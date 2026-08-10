import { ROOT_CAUSES, ROOT_CAUSE_IDS } from './taxonomy';
import type { FailureEntry, RootCause } from './types';

/**
 * Pareto of root causes.
 *
 * Three corrections against the previous implementation, all of which showed
 * on screen:
 *
 *  · **Deterministic ties.** It sorted `Object.entries(counts)` by count with
 *    no tie-break, so two causes with equal counts swapped places depending on
 *    which one happened to be inserted first — the bar chart reordered itself
 *    between renders. Ties now fall back to the taxonomy's declared order.
 *  · **Percentages are not rounded here.** It rounded each share to an
 *    integer and then added the first two together to claim "top 2 explain
 *    N%", which drifted up to two points away from the real figure and could
 *    exceed the cumulative shown in the table beside it. Rounding happens once,
 *    at the point of display.
 *  · **The vital few are found, not assumed.** It hardcoded the first two rows
 *    as dominant. The 80/20 cut is now computed: every row up to and including
 *    the first one whose cumulative share reaches 80%.
 */

export interface ParetoRow {
    cause: RootCause;
    label: string;
    short: string;
    count: number;
    /** Percentage of all entries, 0-100, unrounded. */
    share: number;
    /** Running total of `share` down the ranking, 0-100, unrounded. */
    cumulative: number;
    /** 1-based position in the ranking. */
    rank: number;
    /** In the smallest set of causes that accounts for 80% of failures. */
    vital: boolean;
}

const VITAL_THRESHOLD = 80;

/** Ranked causes, most frequent first. Causes with no entries are omitted. */
export function pareto(entries: readonly FailureEntry[]): ParetoRow[] {
    const total = entries.length;
    if (total === 0) return [];

    const counts = new Map<RootCause, number>();
    for (const entry of entries) {
        counts.set(entry.rootCause, (counts.get(entry.rootCause) ?? 0) + 1);
    }

    const order = new Map<RootCause, number>(
        ROOT_CAUSE_IDS.map((cause, index) => [cause, index])
    );

    const ranked = [...counts.entries()].sort(
        ([causeA, countA], [causeB, countB]) =>
            countB - countA || (order.get(causeA) ?? 0) - (order.get(causeB) ?? 0)
    );

    let running = 0;
    let vitalReached = false;

    return ranked.map(([cause, count], index) => {
        running += count;
        const cumulative = (running / total) * 100;
        // The row that crosses 80% is itself vital; everything after it is not.
        const vital = !vitalReached;
        if (cumulative >= VITAL_THRESHOLD) vitalReached = true;

        return {
            cause,
            label: ROOT_CAUSES[cause].label,
            short: ROOT_CAUSES[cause].short,
            count,
            share: (count / total) * 100,
            cumulative,
            rank: index + 1,
            vital,
        };
    });
}

/** The causes accounting for 80% of failures, in order. */
export function vitalFew(rows: readonly ParetoRow[]): ParetoRow[] {
    return rows.filter((row) => row.vital);
}
