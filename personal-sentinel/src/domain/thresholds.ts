import { STATUS_RANK, type Status } from '@cognitex/theme';

/**
 * Turning numbers into the shared status vocabulary.
 *
 * One function, so "advertencia" means the same distance from the limit on
 * every card. The old console decided this inline at each call site with a
 * different literal each time — `stats.vpd > 120` for heart rate, for a
 * 31-year-old chemist and a 52-year-old driver alike.
 */

/** Thresholds always read better-value-first, whichever way the metric runs. */
export function rank(
    value: number,
    good: number,
    warn: number,
    higherIsBetter = true
): Status {
    if (!Number.isFinite(value)) return 'offline';
    if (higherIsBetter) {
        if (value >= good) return 'ok';
        return value >= warn ? 'warning' : 'alert';
    }
    if (value <= good) return 'ok';
    return value <= warn ? 'warning' : 'alert';
}

/** The worst of several statuses. `offline` only wins when it is alone. */
export function worst(statuses: readonly Status[]): Status {
    if (statuses.length === 0) return 'offline';
    return statuses.reduce((left, right) =>
        STATUS_RANK[right] > STATUS_RANK[left] ? right : left
    );
}
