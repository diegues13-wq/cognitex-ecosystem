import type { Millis } from '@cognitex/data';
import type { Status } from '@cognitex/theme';

import { daysBetween } from './dates';
import type { Constraint, ConstraintStatus } from './types';

/**
 * The constraint board's state machine.
 *
 * The board used to be read-only: three hardcoded constraints rendered into
 * three columns with no way to move a card, and `dias_activa` was a stored
 * integer that never incremented. So a constraint could sit in "en
 * experimento" forever, still claiming it had been there eight days, six
 * months later.
 *
 * Status is now a machine with explicit edges, days-active is derived from
 * `since`, and the reverse edges exist because the process has them: an
 * experiment that fails goes back to active, and a neutralised constraint that
 * reappears is reopened rather than silently duplicated.
 */

export const CONSTRAINT_TRANSITIONS: Record<ConstraintStatus, readonly ConstraintStatus[]> = {
    // Nothing goes straight from blocked to solved without an experiment.
    activa: ['en_experimento'],
    en_experimento: ['neutralizada', 'activa'],
    neutralizada: ['activa'],
};

export const CONSTRAINT_STATUS_LABEL: Record<ConstraintStatus, string> = {
    activa: 'Activa',
    en_experimento: 'En experimento',
    neutralizada: 'Neutralizada',
};

/** How a constraint's status maps onto the shared severity vocabulary. */
export const CONSTRAINT_STATUS: Record<ConstraintStatus, Status> = {
    activa: 'alert',
    en_experimento: 'warning',
    neutralizada: 'ok',
};

export function canTransition(from: ConstraintStatus, to: ConstraintStatus): boolean {
    return CONSTRAINT_TRANSITIONS[from].includes(to);
}

/** The moves offered for a constraint in its current status. */
export function allowedTransitions(from: ConstraintStatus): readonly ConstraintStatus[] {
    return CONSTRAINT_TRANSITIONS[from];
}

export class IllegalTransitionError extends Error {
    constructor(
        readonly from: ConstraintStatus,
        readonly to: ConstraintStatus
    ) {
        super(`Transición no permitida: ${from} → ${to}`);
        this.name = 'IllegalTransitionError';
    }
}

/**
 * Moves a constraint, resetting the clock.
 *
 * Returns a new object; the caller's copy is never mutated. Throws on an
 * illegal edge rather than returning the input unchanged, because a silent
 * no-op on a kanban looks exactly like a dropped write.
 */
export function transitionConstraint(
    constraint: Constraint,
    to: ConstraintStatus,
    now: Millis
): Constraint {
    if (constraint.status === to) return constraint;
    if (!canTransition(constraint.status, to)) {
        throw new IllegalTransitionError(constraint.status, to);
    }
    return { ...constraint, status: to, since: now };
}

/** Days in the current status. Derived, so it cannot go stale. */
export function daysInStatus(constraint: Constraint, now: Millis): number {
    return Math.max(0, daysBetween(constraint.since, now));
}

/**
 * The constraint to attack next.
 *
 * The one blocking the most goals; ties broken by how long it has been
 * blocking. Active beats under-experiment — an experiment is already running,
 * so it is not where the next hour goes. The old version took
 * `RESTRICTIONS.find(r => r.estado === 'activa')`, which is whichever one the
 * seed file happened to list first.
 */
export function priorityConstraint(
    constraints: readonly Constraint[],
    now: Millis
): Constraint | null {
    const ranked = [...constraints]
        .filter((constraint) => constraint.status !== 'neutralizada')
        .sort((a, b) => {
            if (a.status !== b.status) return a.status === 'activa' ? -1 : 1;
            return (
                b.goalIds.length - a.goalIds.length ||
                daysInStatus(b, now) - daysInStatus(a, now) ||
                a.id.localeCompare(b.id)
            );
        });

    return ranked[0] ?? null;
}

export interface ConstraintTally {
    activa: number;
    en_experimento: number;
    neutralizada: number;
    /** Everything not yet neutralised — the number that gates the plan. */
    open: number;
}

export function tallyConstraints(constraints: readonly Constraint[]): ConstraintTally {
    const tally: ConstraintTally = {
        activa: 0,
        en_experimento: 0,
        neutralizada: 0,
        open: 0,
    };

    for (const constraint of constraints) {
        tally[constraint.status] += 1;
    }
    tally.open = tally.activa + tally.en_experimento;
    return tally;
}
