import { describe, expect, it } from 'vitest';

import {
    controlError,
    controlSeries,
    controlStatus,
    controlTrend,
    energyTrend,
    toleranceBand,
} from './controlLoop';
import { GOALS, findGoal } from './taxonomy';
import { at, entries, entry } from './fixtures';
import type { Goal } from './types';

const ppcGoal = findGoal('goal-ppc') as Goal;
const energyGoal = findGoal('goal-energy') as Goal;
const recurrenceGoal = findGoal('goal-recurrence') as Goal;

describe('controlError', () => {
    it('is positive above the setpoint for a higher-is-better goal', () => {
        expect(controlError(95, ppcGoal)).toBe(5);
    });

    it('is negative below the setpoint for a higher-is-better goal', () => {
        expect(controlError(70, ppcGoal)).toBe(-20);
    });

    it('flips sign for a lower-is-better goal, so positive still means good', () => {
        // Recurrence target is 30%; 20% is better than target.
        expect(controlError(20, recurrenceGoal)).toBe(10);
        expect(controlError(45, recurrenceGoal)).toBe(-15);
    });

    it('is zero exactly on the setpoint', () => {
        expect(controlError(90, ppcGoal)).toBe(0);
    });
});

describe('controlStatus', () => {
    it('is ok anywhere at or above the setpoint', () => {
        expect(controlStatus(controlError(95, ppcGoal), ppcGoal)).toBe('ok');
    });

    it('stays ok inside the tolerance band', () => {
        expect(controlStatus(controlError(81, ppcGoal), ppcGoal)).toBe('ok');
    });

    it('warns between one and two tolerances below', () => {
        expect(controlStatus(controlError(75, ppcGoal), ppcGoal)).toBe('warning');
    });

    it('alerts beyond two tolerances below', () => {
        expect(controlStatus(controlError(60, ppcGoal), ppcGoal)).toBe('alert');
    });

    it('is offline when there is no measurement', () => {
        expect(controlStatus(Number.NaN, ppcGoal)).toBe('offline');
    });

    it('applies the same thresholds to a lower-is-better goal', () => {
        expect(controlStatus(controlError(35, recurrenceGoal), recurrenceGoal)).toBe('ok');
        expect(controlStatus(controlError(45, recurrenceGoal), recurrenceGoal)).toBe('warning');
        expect(controlStatus(controlError(70, recurrenceGoal), recurrenceGoal)).toBe('alert');
    });
});

describe('toleranceBand', () => {
    it('brackets the setpoint by the tolerance', () => {
        expect(toleranceBand(ppcGoal)).toEqual({ low: 80, high: 100 });
    });
});

describe('energyTrend', () => {
    const now = at(2026, 3, 10, 23);

    it('averages the entries logged on each day', () => {
        const points = energyTrend(
            [
                entry({ at: at(2026, 3, 10, 9), energy: 2 }),
                entry({ at: at(2026, 3, 10, 18), energy: 4 }),
                entry({ at: at(2026, 3, 9, 9), energy: 5 }),
            ],
            { days: 30, now }
        );

        expect(points).toHaveLength(2);
        expect(points[0]?.value).toBe(5);
        expect(points[1]?.value).toBe(3);
    });

    it('emits nothing for days with no entries', () => {
        expect(energyTrend([], { days: 30, now })).toEqual([]);
    });
});

describe('controlSeries', () => {
    const now = at(2026, 3, 5);

    it('plots weekly PPC against its setpoint', () => {
        const series = controlSeries(
            ppcGoal,
            entries([
                ['sobrecompromiso', 'si', at(2026, 3, 2)],
                ['sobrecompromiso', 'no', at(2026, 3, 3)],
            ]),
            { days: 14, now }
        );

        expect(series).toHaveLength(1);
        expect(series[0]?.actual).toBe(50);
        expect(series[0]?.setpoint).toBe(90);
        expect(series[0]?.error).toBe(-40);
    });

    it('drops weeks in which nothing came due rather than plotting a zero', () => {
        const series = controlSeries(
            ppcGoal,
            [entry({ at: at(2026, 3, 3), adjustmentStatus: 'pendiente' })],
            { days: 14, now }
        );

        expect(series).toEqual([]);
    });

    it('plots the energy signal from the same log', () => {
        const series = controlSeries(energyGoal, [entry({ at: at(2026, 3, 4), energy: 5 })], {
            days: 14,
            now,
        });

        expect(series[0]?.actual).toBe(5);
        expect(series[0]?.error).toBe(1);
    });

    it('is empty when the log holds no measurement for the goal', () => {
        for (const goal of GOALS) {
            expect(controlSeries(goal, [], { days: 30, now })).toEqual([]);
        }
    });
});

describe('controlTrend', () => {
    it('reports improvement as positive for a higher-is-better goal', () => {
        const trend = controlTrend(
            [
                { at: 1, actual: 50, setpoint: 90, error: -40 },
                { at: 2, actual: 60, setpoint: 90, error: -30 },
            ],
            ppcGoal
        );

        expect(trend).toBeCloseTo(0.2, 10);
    });

    it('reports a falling recurrence as improvement, not decline', () => {
        const trend = controlTrend(
            [
                { at: 1, actual: 50, setpoint: 30, error: -20 },
                { at: 2, actual: 40, setpoint: 30, error: -10 },
            ],
            recurrenceGoal
        );

        expect(trend).toBeGreaterThan(0);
    });

    it('is null when there is nothing to compare against', () => {
        expect(controlTrend([{ at: 1, actual: 50, setpoint: 90, error: -40 }], ppcGoal)).toBeNull();
        expect(controlTrend([], ppcGoal)).toBeNull();
    });

    it('is null rather than infinite when the previous value was zero', () => {
        const trend = controlTrend(
            [
                { at: 1, actual: 0, setpoint: 90, error: -90 },
                { at: 2, actual: 40, setpoint: 90, error: -50 },
            ],
            ppcGoal
        );

        expect(trend).toBeNull();
    });
});
