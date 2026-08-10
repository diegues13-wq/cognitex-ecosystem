import type { Millis } from '@cognitex/data';

/**
 * The Last Planner vocabulary, typed.
 *
 * The old app kept every one of these as a bare string in React state, so
 * `implementado` could be 'si', 'pendiente' or — after a round trip through
 * the mock service — `undefined`, and three components each guessed
 * differently what an unknown value meant. Closed unions make an unhandled
 * case a build error instead of a blank cell.
 */

/** The root-cause taxonomy. Labels and counter-measures live in taxonomy.ts. */
export type RootCause =
    | 'sobrecompromiso'
    | 'evitacion_conflicto'
    | 'falta_descomposicion'
    | 'gestion_energia'
    | 'distraccion_entorno'
    | 'perfeccionismo'
    | 'miedo_exposicion';

/**
 * Whether yesterday's adjustment was actually carried out.
 *
 * `pendiente` means "not yet verified", which is different from "not done" —
 * the original conflated them and every unverified entry silently counted as a
 * failure in the implementation rate.
 */
export type AdjustmentStatus = 'pendiente' | 'si' | 'parcial' | 'no';

/** Self-reported energy at the time of the failure. */
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

/**
 * One logged failure and the commitment made against it.
 *
 * In Last Planner terms: the failure is the variance, `adjustment` is the
 * commitment for the next cycle, and `adjustmentStatus` is its completion —
 * which is what plan-percent-complete is computed from.
 */
export interface FailureEntry {
    id: string;
    /** Tenant. Every read and write is scoped by it. */
    orgId: string;
    /** Local calendar day, `yyyy-mm-dd`. The unit adherence is measured in. */
    date: string;
    /** Exact instant, milliseconds since epoch. */
    at: Millis;
    /** What went wrong. Event language, never identity language. */
    failure: string;
    rootCause: RootCause;
    /** The concrete commitment for the next day. */
    adjustment: string;
    adjustmentStatus: AdjustmentStatus;
    /** What went right. Optional; empty string when not recorded. */
    win: string;
    energy: EnergyLevel;
    /** Which goal this failure pulled away from. Empty when unassigned. */
    goalId: string;
}

/** A new entry before the store assigns it an id. */
export type DraftEntry = Omit<FailureEntry, 'id'>;

/**
 * A systemic blocker, tracked on the kanban.
 *
 * `activa` → `en_experimento` → `neutralizada`, with the reverse edges that
 * reality requires: an experiment that fails goes back to active, and a
 * neutralised constraint that reappears is reopened. constraints.ts owns the
 * legal edges.
 */
export type ConstraintStatus = 'activa' | 'en_experimento' | 'neutralizada';

export interface Constraint {
    id: string;
    orgId: string;
    description: string;
    rootCause: RootCause;
    status: ConstraintStatus;
    /** When it entered its current status. Days active are derived, not stored. */
    since: Millis;
    /** Goals this constraint blocks. */
    goalIds: string[];
}

/**
 * What a goal is measured by.
 *
 * Every setpoint in this console now has a process variable that comes out of
 * the log. The original three goals — deep-work hours, commitments kept,
 * difficult conversations — had no instrumentation at all: two of them were
 * plotted from a random walk in the generator and presented as measurement.
 */
export type GoalSignal = 'ppc' | 'energy' | 'recurrence';

export interface Goal {
    id: string;
    name: string;
    /** One line saying what the number actually counts. */
    definition: string;
    signal: GoalSignal;
    unit: string;
    /** Setpoint. */
    target: number;
    /** How far from the setpoint still counts as on-target. */
    tolerance: number;
    /** Whether a higher process value is better. Recurrence is the exception. */
    direction: 'higher' | 'lower';
    precision: number;
}
