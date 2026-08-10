import { toDateKey } from './dates';
import type { AdjustmentStatus, Constraint, FailureEntry, RootCause } from './types';

/**
 * Test fixtures.
 *
 * Not in a `.test.ts` file so several suites can share them, and typed against
 * the real interfaces so a change to `FailureEntry` breaks the fixtures rather
 * than the assertions.
 *
 * Timestamps are built from local `Date` components, never from UTC literals,
 * so the suite gives the same answers in Quito and in CI.
 */

export function at(year: number, month: number, day: number, hour = 9): number {
    return new Date(year, month - 1, day, hour, 0, 0, 0).getTime();
}

let counter = 0;

export function entry(overrides: Partial<FailureEntry> & { at: number }): FailureEntry {
    counter += 1;
    return {
        id: `entry-${counter}`,
        orgId: 'test-org',
        date: toDateKey(overrides.at),
        failure: 'Hoy pospuse la llamada difícil',
        rootCause: 'sobrecompromiso',
        adjustment: 'Agendar la llamada antes de las 10:00',
        adjustmentStatus: 'pendiente',
        win: '',
        energy: 3,
        goalId: 'goal-ppc',
        ...overrides,
    };
}

/** A day's worth of entries, one per cause/status pair given. */
export function entries(
    specs: readonly [RootCause, AdjustmentStatus, number][]
): FailureEntry[] {
    return specs.map(([rootCause, adjustmentStatus, when]) =>
        entry({ at: when, rootCause, adjustmentStatus })
    );
}

export function constraint(overrides: Partial<Constraint> & { id: string }): Constraint {
    return {
        orgId: 'test-org',
        description: 'Sobrecompromiso crónico',
        rootCause: 'sobrecompromiso',
        status: 'activa',
        since: at(2026, 1, 1),
        goalIds: ['goal-ppc'],
        ...overrides,
    };
}
