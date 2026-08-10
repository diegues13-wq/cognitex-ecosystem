import { describe, expect, it } from 'vitest';

import {
    addDays,
    daysBetween,
    fromDateKey,
    isoWeek,
    shortDate,
    startOfDay,
    startOfWeek,
    toDateKey,
} from './dates';
import { at } from './fixtures';

describe('toDateKey / fromDateKey', () => {
    it('round-trips a local calendar day', () => {
        const key = toDateKey(at(2026, 3, 5, 23));

        expect(key).toBe('2026-03-05');
        expect(fromDateKey(key)).toBe(startOfDay(at(2026, 3, 5, 23)));
    });

    it('pads single digits', () => {
        expect(toDateKey(at(2026, 1, 9))).toBe('2026-01-09');
    });

    it('returns NaN for a malformed key instead of an epoch date', () => {
        expect(Number.isNaN(fromDateKey('ayer'))).toBe(true);
        expect(Number.isNaN(fromDateKey('2026-3-5'))).toBe(true);
    });
});

describe('startOfWeek', () => {
    it('returns the Monday of the week', () => {
        // 5 March 2026 is a Thursday.
        expect(toDateKey(startOfWeek(at(2026, 3, 5)))).toBe('2026-03-02');
    });

    it('puts Sunday in the week that just ended, as ISO 8601 requires', () => {
        expect(toDateKey(startOfWeek(at(2026, 3, 8)))).toBe('2026-03-02');
    });

    it('is idempotent on a Monday', () => {
        const monday = startOfWeek(at(2026, 3, 5));

        expect(startOfWeek(monday)).toBe(monday);
    });
});

describe('isoWeek', () => {
    it('numbers a mid-year week', () => {
        expect(isoWeek(at(2026, 3, 2))).toBe(10);
    });

    it('gives 1 January 2026 to week 1', () => {
        expect(isoWeek(at(2026, 1, 1))).toBe(1);
    });

    it('gives 1 January 2027 to week 53 of 2026, not week 1', () => {
        // 2027 starts on a Friday, so its first days belong to the previous
        // ISO year. date-fns `getWeek` returned 1 here, and the synthesis
        // header said "Semana 1" in the last days of December.
        expect(isoWeek(at(2027, 1, 1))).toBe(53);
    });

    it('gives 29 December 2025 to week 1 of 2026', () => {
        expect(isoWeek(at(2025, 12, 29))).toBe(1);
    });
});

describe('addDays', () => {
    it('steps whole calendar days', () => {
        expect(toDateKey(addDays(at(2026, 2, 27), 2))).toBe('2026-03-01');
    });

    it('steps backwards across a year boundary', () => {
        expect(toDateKey(addDays(at(2026, 1, 1), -1))).toBe('2025-12-31');
    });
});

describe('daysBetween', () => {
    it('ignores the time of day', () => {
        expect(daysBetween(at(2026, 3, 1, 23), at(2026, 3, 2, 1))).toBe(1);
    });

    it('is negative when the order is reversed', () => {
        expect(daysBetween(at(2026, 3, 5), at(2026, 3, 1))).toBe(-4);
    });
});

describe('shortDate', () => {
    it('formats as dd/MM', () => {
        expect(shortDate(at(2026, 3, 5))).toBe('05/03');
    });
});
