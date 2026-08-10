import { describe, expect, it } from 'vitest';

import {
    detectRecurrence,
    recurrenceRate,
    recurrenceTrend,
    repeatOffenders,
} from './recurrence';
import { at, entries, entry } from './fixtures';

describe('detectRecurrence', () => {
    it('does not flag the first sighting of a cause', () => {
        const flagged = detectRecurrence([entry({ at: at(2026, 3, 2) })]);

        expect(flagged[0]?.recurring).toBe(false);
        expect(flagged[0]?.previousAt).toBeNull();
    });

    it('flags the same cause seen again inside the window', () => {
        const flagged = detectRecurrence(
            entries([
                ['sobrecompromiso', 'si', at(2026, 3, 2)],
                ['sobrecompromiso', 'si', at(2026, 3, 9)],
            ]),
            14
        );

        expect(flagged.map((item) => item.recurring)).toEqual([false, true]);
        expect(flagged[1]?.daysSincePrevious).toBe(7);
    });

    it('does not flag a cause that fell outside the window', () => {
        const flagged = detectRecurrence(
            entries([
                ['sobrecompromiso', 'si', at(2026, 3, 1)],
                ['sobrecompromiso', 'si', at(2026, 4, 1)],
            ]),
            14
        );

        expect(flagged.map((item) => item.recurring)).toEqual([false, false]);
    });

    it('treats each cause independently', () => {
        const flagged = detectRecurrence(
            entries([
                ['sobrecompromiso', 'si', at(2026, 3, 2)],
                ['perfeccionismo', 'si', at(2026, 3, 3)],
                ['sobrecompromiso', 'si', at(2026, 3, 4)],
            ]),
            14
        );

        expect(flagged.map((item) => item.recurring)).toEqual([false, false, true]);
    });

    it('flags a repeat on the same day', () => {
        const flagged = detectRecurrence(
            entries([
                ['gestion_energia', 'si', at(2026, 3, 2, 9)],
                ['gestion_energia', 'si', at(2026, 3, 2, 17)],
            ]),
            14
        );

        expect(flagged.map((item) => item.recurring)).toEqual([false, true]);
        expect(flagged[1]?.daysSincePrevious).toBe(0);
    });

    it('is order-independent — it sorts before it decides', () => {
        const chronological = entries([
            ['sobrecompromiso', 'si', at(2026, 3, 2)],
            ['sobrecompromiso', 'si', at(2026, 3, 5)],
        ]);
        const shuffled = [...chronological].reverse();

        expect(detectRecurrence(shuffled).map((item) => item.recurring)).toEqual([false, true]);
    });

    it('measures the window from the previous occurrence, not the first', () => {
        // 1 → 12 → 23 March: each gap is 11 days, so both repeats count even
        // though the last is 22 days after the first.
        const flagged = detectRecurrence(
            entries([
                ['perfeccionismo', 'si', at(2026, 3, 1)],
                ['perfeccionismo', 'si', at(2026, 3, 12)],
                ['perfeccionismo', 'si', at(2026, 3, 23)],
            ]),
            14
        );

        expect(flagged.map((item) => item.recurring)).toEqual([false, true, true]);
    });
});

describe('recurrenceRate', () => {
    it('is the share of flagged entries', () => {
        const rate = recurrenceRate(
            entries([
                ['sobrecompromiso', 'si', at(2026, 3, 2)],
                ['sobrecompromiso', 'si', at(2026, 3, 3)],
                ['perfeccionismo', 'si', at(2026, 3, 4)],
                ['gestion_energia', 'si', at(2026, 3, 5)],
            ])
        );

        expect(rate).toBe(25);
    });

    it('is zero for an empty log', () => {
        expect(recurrenceRate([])).toBe(0);
    });
});

describe('recurrenceTrend', () => {
    const now = at(2026, 3, 10, 23);

    it('emits one point per day that has entries in its trailing window', () => {
        const points = recurrenceTrend(
            entries([
                ['sobrecompromiso', 'si', at(2026, 3, 9)],
                ['sobrecompromiso', 'si', at(2026, 3, 10)],
            ]),
            { days: 30, trailingDays: 7, now }
        );

        // The window is seven days wide, so both entries stay in view for the
        // two days that exist and for none of the days before them.
        expect(points).toHaveLength(2);
        expect(points.at(-1)?.value).toBe(50);
    });

    it('skips days with no data instead of drawing them as zero', () => {
        const points = recurrenceTrend([entry({ at: at(2026, 3, 10) })], {
            days: 30,
            trailingDays: 1,
            now,
        });

        expect(points).toHaveLength(1);
    });

    it('is empty when the log is', () => {
        expect(recurrenceTrend([], { days: 30, now })).toEqual([]);
    });
});

describe('repeatOffenders', () => {
    it('ranks by number of repeats, not by number of occurrences', () => {
        const offenders = repeatOffenders(
            entries([
                // Three sightings a month apart: many occurrences, no repeats.
                ['miedo_exposicion', 'si', at(2026, 1, 1)],
                ['miedo_exposicion', 'si', at(2026, 2, 1)],
                ['miedo_exposicion', 'si', at(2026, 3, 1)],
                // Two sightings a day apart: fewer occurrences, one repeat.
                ['perfeccionismo', 'si', at(2026, 3, 2)],
                ['perfeccionismo', 'si', at(2026, 3, 3)],
            ]),
            14
        );

        expect(offenders.map((item) => item.cause)).toEqual(['perfeccionismo']);
        expect(offenders[0]?.repeats).toBe(1);
        expect(offenders[0]?.lastGapDays).toBe(1);
    });
});
