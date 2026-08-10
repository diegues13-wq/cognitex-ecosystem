import type { Millis } from '@cognitex/data';
import type { Status } from '@cognitex/theme';
import type { SeriesPoint } from '@cognitex/ui';

import { addDays, startOfDay } from './dates';
import { weeklyPpc } from './ppc';
import { recurrenceTrend } from './recurrence';
import type { FailureEntry, Goal } from './types';

/**
 * The control loop: setpoint, process variable, error.
 *
 * The panel this replaces plotted `generateControlLoopData()` — a seeded
 * random walk — under the axis label "PV (Valor Real)", for goals the app had
 * no measurement of. Every series here comes out of the failure log:
 *
 *   ppc         weekly plan-percent-complete
 *   energy      mean self-reported energy per day
 *   recurrence  trailing 7-day recurrence rate
 *
 * If a goal cannot be computed from the log, `controlSeries` returns an empty
 * array and the view says so, rather than drawing something.
 */

export interface ControlPoint {
    at: Millis;
    /** The measurement. */
    actual: number;
    setpoint: number;
    /**
     * Signed distance to the setpoint, oriented so positive is always good.
     * For a lower-is-better goal it is `setpoint - actual`.
     */
    error: number;
}

/** Orientation-aware error. Positive means at or beyond the setpoint. */
export function controlError(actual: number, goal: Goal): number {
    return goal.direction === 'higher' ? actual - goal.target : goal.target - actual;
}

/**
 * Where the loop stands.
 *
 * Inside tolerance is on-target; up to twice the tolerance is drifting;
 * further is out of control. One threshold pair for every goal, so "warning"
 * means the same thing on each panel.
 */
export function controlStatus(error: number, goal: Goal): Status {
    if (!Number.isFinite(error)) return 'offline';
    if (error >= -goal.tolerance) return 'ok';
    if (error >= -goal.tolerance * 2) return 'warning';
    return 'alert';
}

/** The tolerance band around the setpoint, drawn behind the line. */
export function toleranceBand(goal: Goal): { low: number; high: number } {
    return { low: goal.target - goal.tolerance, high: goal.target + goal.tolerance };
}

/** Mean declared energy per day, one point per day that has entries. */
export function energyTrend(
    entries: readonly FailureEntry[],
    options: { days: number; now: Millis }
): SeriesPoint[] {
    const byDay = new Map<Millis, { sum: number; count: number }>();
    const earliest = startOfDay(addDays(options.now, -(options.days - 1)));

    for (const entry of entries) {
        if (entry.at < earliest || entry.at > options.now) continue;
        const day = startOfDay(entry.at);
        const bucket = byDay.get(day) ?? { sum: 0, count: 0 };
        bucket.sum += entry.energy;
        bucket.count += 1;
        byDay.set(day, bucket);
    }

    return [...byDay.entries()]
        .sort(([a], [b]) => a - b)
        .map(([day, bucket]) => ({ at: day, value: bucket.sum / bucket.count }));
}

/**
 * The process variable for a goal, oldest first.
 *
 * Empty when the log holds nothing to compute it from — an empty chart is an
 * honest chart.
 */
export function controlSeries(
    goal: Goal,
    entries: readonly FailureEntry[],
    options: { days: number; now: Millis }
): ControlPoint[] {
    const points = measure(goal, entries, options);
    return points.map((point) => ({
        at: point.at,
        actual: point.value,
        setpoint: goal.target,
        error: controlError(point.value, goal),
    }));
}

function measure(
    goal: Goal,
    entries: readonly FailureEntry[],
    options: { days: number; now: Millis }
): SeriesPoint[] {
    switch (goal.signal) {
        case 'ppc':
            return weeklyPpc(entries, {
                weeks: Math.max(1, Math.ceil(options.days / 7)),
                now: options.now,
            })
                .filter((week) => week.result.planned > 0)
                .map((week) => ({ at: week.weekStart, value: week.result.ppc }));

        case 'energy':
            return energyTrend(entries, options);

        case 'recurrence':
            return recurrenceTrend(entries, { days: options.days, now: options.now });
    }
}

/** The most recent point, or null when the loop has no measurement yet. */
export function latestPoint(series: readonly ControlPoint[]): ControlPoint | null {
    return series.at(-1) ?? null;
}

/**
 * Direction of travel over the tail of the series.
 *
 * Returned as a fraction so it can go straight into `MetricCard`'s `trend`,
 * and oriented by the goal so "up" always means improving.
 */
export function controlTrend(series: readonly ControlPoint[], goal: Goal): number | null {
    if (series.length < 2) return null;

    const latest = series.at(-1);
    const previous = series.at(-2);
    if (!latest || !previous) return null;
    if (previous.actual === 0) return null;

    const change = (latest.actual - previous.actual) / Math.abs(previous.actual);
    return goal.direction === 'higher' ? change : -change;
}
