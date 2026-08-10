import type { Millis } from '@cognitex/data';

import { addDays, isoWeek, startOfWeek } from './dates';
import { daysInStatus, priorityConstraint, tallyConstraints } from './constraints';
import { pareto, vitalFew, type ParetoRow } from './pareto';
import { adherence, computePpc, type Adherence, type PpcResult } from './ppc';
import { recurrenceRate } from './recurrence';
import { ROOT_CAUSES } from './taxonomy';
import type { Constraint, FailureEntry } from './types';

/**
 * The weekly synthesis, computed rather than written.
 *
 * The panel this replaces returned a fixed object: the same hypothesis, the
 * same action and the same success metric every week, for every user, no
 * matter what the log contained — with a "Generar nueva síntesis" button that
 * waited 1.2 seconds and re-rendered the identical text. It also counted the
 * dominant causes over *all* entries while labelling them "esta semana".
 *
 * Everything below is a function of the week's entries and the board.
 */

export interface Experiment {
    hypothesis: string;
    action: string;
    metric: string;
}

export interface WeeklySynthesis {
    weekNumber: number;
    weekStart: Millis;
    weekEnd: Millis;
    entryCount: number;
    ppc: PpcResult;
    /** PPC of the week before, for the delta. Null when there is no history. */
    previousPpc: PpcResult | null;
    adherence: Adherence;
    recurrence: number;
    /** The week's vital few, not the whole history's. */
    dominant: ParetoRow[];
    priority: Constraint | null;
    priorityDays: number;
    openConstraints: number;
    /** Null when the week holds nothing to base an experiment on. */
    experiment: Experiment | null;
}

export function weeklySynthesis(
    entries: readonly FailureEntry[],
    constraints: readonly Constraint[],
    now: Millis
): WeeklySynthesis {
    const weekStart = startOfWeek(now);
    const weekEnd = addDays(weekStart, 7) - 1;
    const previousStart = addDays(weekStart, -7);

    const week = entries.filter((entry) => entry.at >= weekStart && entry.at <= weekEnd);
    const previous = entries.filter(
        (entry) => entry.at >= previousStart && entry.at < weekStart
    );

    const rows = pareto(week);
    const dominant = vitalFew(rows);
    const priority = priorityConstraint(constraints, now);

    return {
        weekNumber: isoWeek(weekStart),
        weekStart,
        weekEnd,
        entryCount: week.length,
        ppc: computePpc(week),
        previousPpc: previous.length > 0 ? computePpc(previous) : null,
        adherence: adherence(week, { days: 7, now }),
        recurrence: recurrenceRate(week),
        dominant,
        priority,
        priorityDays: priority ? daysInStatus(priority, now) : 0,
        openConstraints: tallyConstraints(constraints).open,
        experiment: buildExperiment(dominant, priority),
    };
}

/**
 * The week's experiment.
 *
 * Built from the dominant cause's standard counter-measure, aimed at the
 * priority constraint when there is one. The success metric is stated in the
 * units the console actually measures, so next week's synthesis can settle it.
 */
function buildExperiment(
    dominant: readonly ParetoRow[],
    priority: Constraint | null
): Experiment | null {
    const leading = dominant[0];
    if (!leading) return null;

    const cause = ROOT_CAUSES[leading.cause];
    const share = Math.round(leading.share);
    const target = priority ? `«${priority.description}»` : cause.label.toLowerCase();

    return {
        hypothesis: `Si se aplica la contramedida de ${cause.label.toLowerCase()}, la restricción ${target} deja de explicar el ${share}% de los fallos de la semana.`,
        action: cause.counterMeasure,
        metric: `Fallos por ${cause.label.toLowerCase()} por debajo del ${Math.max(
            5,
            Math.round(share / 2)
        )}% del total, y PPC igual o mayor al 90%.`,
    };
}
