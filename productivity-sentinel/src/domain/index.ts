/**
 * The Last Planner domain.
 *
 * Everything in here is a pure function of typed data with no React, no
 * Firestore and no date library. That is what makes the calculations testable,
 * and the calculations are the product — the rest of this app is a way of
 * looking at them.
 */

export type {
    AdjustmentStatus,
    Constraint,
    ConstraintStatus,
    DraftEntry,
    EnergyLevel,
    FailureEntry,
    Goal,
    GoalSignal,
    RootCause,
} from './types';

export {
    GOALS,
    ROOT_CAUSES,
    ROOT_CAUSE_IDS,
    findGoal,
    isRootCause,
    type RootCauseMeta,
} from './taxonomy';

export {
    DAY_MS,
    addDays,
    daysBetween,
    fromDateKey,
    isoWeek,
    shortDate,
    startOfDay,
    startOfWeek,
    toDateKey,
} from './dates';

export {
    adherence,
    computePpc,
    implementationRate,
    weeklyPpc,
    type Adherence,
    type PpcResult,
    type WeeklyPpc,
} from './ppc';

export { pareto, vitalFew, type ParetoRow } from './pareto';

export {
    DEFAULT_WINDOW_DAYS,
    detectRecurrence,
    recurrenceRate,
    recurrenceTrend,
    repeatOffenders,
    type RecurrentEntry,
    type RepeatOffender,
} from './recurrence';

export {
    CONSTRAINT_STATUS,
    CONSTRAINT_STATUS_LABEL,
    CONSTRAINT_TRANSITIONS,
    IllegalTransitionError,
    allowedTransitions,
    canTransition,
    daysInStatus,
    priorityConstraint,
    tallyConstraints,
    transitionConstraint,
    type ConstraintTally,
} from './constraints';

export {
    controlError,
    controlSeries,
    controlStatus,
    controlTrend,
    energyTrend,
    latestPoint,
    toleranceBand,
    type ControlPoint,
} from './controlLoop';

export { weeklySynthesis, type Experiment, type WeeklySynthesis } from './synthesis';
