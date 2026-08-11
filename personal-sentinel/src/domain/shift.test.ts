import { describe, expect, it } from 'vitest';

import { formatDuration, hoursOnShift, isOnShift, shiftHours, startOfDay } from './shift';
import { WORK_SHIFT } from './workers';
import { at } from './fixtures';

describe('isOnShift', () => {
    it('includes the first hour and excludes the last', () => {
        expect(isOnShift(at(2026, 4, 6, 8), WORK_SHIFT)).toBe(true);
        expect(isOnShift(at(2026, 4, 6, 16, 59), WORK_SHIFT)).toBe(true);
        // The old generator's `hour <= 17` counted the whole 17:00 hour and
        // made the shift ten hours long.
        expect(isOnShift(at(2026, 4, 6, 17), WORK_SHIFT)).toBe(false);
        expect(isOnShift(at(2026, 4, 6, 7, 59), WORK_SHIFT)).toBe(false);
    });

    it('handles a night shift that wraps midnight', () => {
        const night = { startHour: 20, endHour: 4 };

        expect(isOnShift(at(2026, 4, 6, 23), night)).toBe(true);
        expect(isOnShift(at(2026, 4, 6, 2), night)).toBe(true);
        expect(isOnShift(at(2026, 4, 6, 12), night)).toBe(false);
    });
});

describe('shiftHours', () => {
    it('measures the half-open window', () => {
        expect(shiftHours(WORK_SHIFT)).toBe(9);
        expect(shiftHours({ startHour: 20, endHour: 4 })).toBe(8);
    });
});

describe('hoursOnShift', () => {
    it('counts fractionally, so fatigue does not jump on the hour', () => {
        expect(hoursOnShift(at(2026, 4, 6, 8), WORK_SHIFT)).toBe(0);
        expect(hoursOnShift(at(2026, 4, 6, 8, 30), WORK_SHIFT)).toBeCloseTo(0.5, 6);
        expect(hoursOnShift(at(2026, 4, 6, 16), WORK_SHIFT)).toBeCloseTo(8, 6);
    });

    it('is zero off shift rather than negative', () => {
        expect(hoursOnShift(at(2026, 4, 6, 3), WORK_SHIFT)).toBe(0);
        expect(hoursOnShift(at(2026, 4, 6, 22), WORK_SHIFT)).toBe(0);
    });

    it('counts across midnight on a night shift', () => {
        const night = { startHour: 20, endHour: 4 };

        expect(hoursOnShift(at(2026, 4, 6, 22), night)).toBeCloseTo(2, 6);
        expect(hoursOnShift(at(2026, 4, 6, 1), night)).toBeCloseTo(5, 6);
    });
});

describe('startOfDay', () => {
    it('returns local midnight, not UTC midnight', () => {
        const midnight = startOfDay(at(2026, 4, 6, 15));

        expect(new Date(midnight).getHours()).toBe(0);
        expect(new Date(midnight).getDate()).toBe(6);
    });
});

describe('formatDuration', () => {
    it('never collapses a real event to zero', () => {
        expect(formatDuration(40_000)).toBe('<1 min');
    });

    it('reads as hours and minutes', () => {
        expect(formatDuration(25 * 60_000)).toBe('25 min');
        expect(formatDuration(180 * 60_000)).toBe('3 h');
        expect(formatDuration(140 * 60_000)).toBe('2 h 20 min');
    });

    it('refuses to render a nonsense duration', () => {
        expect(formatDuration(Number.NaN)).toBe('—');
        expect(formatDuration(-5)).toBe('—');
    });
});
