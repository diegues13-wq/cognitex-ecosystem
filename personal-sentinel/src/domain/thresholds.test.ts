import { describe, expect, it } from 'vitest';

import { rank, worst } from './thresholds';

describe('rank', () => {
    it('reads higher-is-better metrics from the good end', () => {
        expect(rank(95, 90, 70)).toBe('ok');
        expect(rank(80, 90, 70)).toBe('warning');
        expect(rank(50, 90, 70)).toBe('alert');
    });

    it('reads lower-is-better metrics from the good end too', () => {
        expect(rank(10, 30, 60, false)).toBe('ok');
        expect(rank(45, 30, 60, false)).toBe('warning');
        expect(rank(85, 30, 60, false)).toBe('alert');
    });

    it('treats a legitimate zero as a value, not as missing data', () => {
        // Zero exposure is the best possible safety reading, and the card that
        // rendered `value || '--'` showed it as "no data".
        expect(rank(0, 30, 60, false)).toBe('ok');
        expect(rank(0, 90, 70)).toBe('alert');
    });

    it('is offline, not alert, when the number is not a number', () => {
        expect(rank(Number.NaN, 90, 70)).toBe('offline');
    });
});

describe('worst', () => {
    it('picks the most severe status', () => {
        expect(worst(['ok', 'warning', 'alert'])).toBe('alert');
        expect(worst(['ok', 'ok'])).toBe('ok');
    });

    it('ranks a real status above no signal', () => {
        expect(worst(['offline', 'warning'])).toBe('warning');
    });

    it('is offline when there is nothing to rank', () => {
        expect(worst([])).toBe('offline');
    });
});
