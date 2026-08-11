import { describe, expect, it } from 'vitest';

import { at } from './fixtures';
import { formatDuration, isScheduled, shiftHours, startOfDay } from './shift';
import { PRODUCTION_SHIFT } from './machines';

describe('isScheduled', () => {
    it('includes the first hour of the shift and excludes the last', () => {
        expect(isScheduled(at(2026, 4, 6, 6), PRODUCTION_SHIFT)).toBe(true);
        expect(isScheduled(at(2026, 4, 6, 21, 59), PRODUCTION_SHIFT)).toBe(true);
        // The old generator's `hour <= 22` counted the whole 22:00 hour and
        // made the shift 17 hours long.
        expect(isScheduled(at(2026, 4, 6, 22), PRODUCTION_SHIFT)).toBe(false);
        expect(isScheduled(at(2026, 4, 6, 5, 59), PRODUCTION_SHIFT)).toBe(false);
    });

    it('handles a window that wraps midnight', () => {
        const night = { startHour: 22, endHour: 6 };

        expect(isScheduled(at(2026, 4, 6, 23), night)).toBe(true);
        expect(isScheduled(at(2026, 4, 6, 2), night)).toBe(true);
        expect(isScheduled(at(2026, 4, 6, 12), night)).toBe(false);
    });

    it('treats a zero-length window as never scheduled', () => {
        expect(isScheduled(at(2026, 4, 6, 9), { startHour: 8, endHour: 8 })).toBe(false);
    });
});

describe('shiftHours', () => {
    it('measures the half-open window', () => {
        expect(shiftHours(PRODUCTION_SHIFT)).toBe(16);
    });

    it('measures a window that wraps midnight', () => {
        expect(shiftHours({ startHour: 22, endHour: 6 })).toBe(8);
    });
});

describe('startOfDay', () => {
    it('returns local midnight, not UTC midnight', () => {
        const noon = at(2026, 4, 6, 12);
        const midnight = startOfDay(noon);

        expect(new Date(midnight).getHours()).toBe(0);
        expect(new Date(midnight).getDate()).toBe(6);
    });
});

describe('formatDuration', () => {
    it('never collapses a real stop to zero', () => {
        expect(formatDuration(20_000)).toBe('<1 min');
    });

    it('reads as hours and minutes', () => {
        expect(formatDuration(45 * 60_000)).toBe('45 min');
        expect(formatDuration(120 * 60_000)).toBe('2 h');
        expect(formatDuration(95 * 60_000)).toBe('1 h 35 min');
    });

    it('refuses to render a nonsense duration', () => {
        expect(formatDuration(Number.NaN)).toBe('—');
        expect(formatDuration(-1)).toBe('—');
    });
});
