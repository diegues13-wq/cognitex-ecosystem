import { describe, expect, it } from 'vitest';

import { adherence, computePpc, implementationRate, weeklyPpc } from './ppc';
import { at, entries, entry } from './fixtures';

describe('computePpc', () => {
    it('counts only fully completed commitments, Last Planner style', () => {
        const result = computePpc(
            entries([
                ['sobrecompromiso', 'si', at(2026, 3, 2)],
                ['sobrecompromiso', 'si', at(2026, 3, 3)],
                ['perfeccionismo', 'parcial', at(2026, 3, 4)],
                ['gestion_energia', 'no', at(2026, 3, 5)],
            ])
        );

        expect(result.planned).toBe(4);
        expect(result.completed).toBe(2);
        expect(result.partial).toBe(1);
        expect(result.failed).toBe(1);
        expect(result.ppc).toBe(50);
    });

    it('excludes unverified commitments from the denominator', () => {
        const result = computePpc(
            entries([
                ['sobrecompromiso', 'si', at(2026, 3, 2)],
                ['sobrecompromiso', 'pendiente', at(2026, 3, 3)],
                ['sobrecompromiso', 'pendiente', at(2026, 3, 4)],
            ])
        );

        // One commitment came due and was met: 100%, not 33%.
        expect(result.planned).toBe(1);
        expect(result.pending).toBe(2);
        expect(result.ppc).toBe(100);
    });

    it('reports zero planned rather than a fabricated rate on an empty week', () => {
        const result = computePpc([]);

        expect(result.planned).toBe(0);
        expect(result.ppc).toBe(0);
    });

    it('reports a real zero when every commitment failed', () => {
        const result = computePpc(
            entries([
                ['sobrecompromiso', 'no', at(2026, 3, 2)],
                ['perfeccionismo', 'no', at(2026, 3, 3)],
            ])
        );

        // Indistinguishable from the empty case unless `planned` is read.
        expect(result.ppc).toBe(0);
        expect(result.planned).toBe(2);
    });

    it('is exact, not rounded, so a third stays a third', () => {
        const result = computePpc(
            entries([
                ['sobrecompromiso', 'si', at(2026, 3, 2)],
                ['sobrecompromiso', 'no', at(2026, 3, 3)],
                ['sobrecompromiso', 'no', at(2026, 3, 4)],
            ])
        );

        expect(result.ppc).toBeCloseTo(33.3333, 3);
    });
});

describe('implementationRate', () => {
    it('gives partial credit where PPC does not', () => {
        const week = entries([
            ['sobrecompromiso', 'si', at(2026, 3, 2)],
            ['perfeccionismo', 'parcial', at(2026, 3, 3)],
            ['gestion_energia', 'no', at(2026, 3, 4)],
        ]);

        expect(computePpc(week).ppc).toBeCloseTo(33.333, 2);
        expect(implementationRate(week)).toBeCloseTo(50, 5);
    });

    it('is zero when nothing came due', () => {
        expect(implementationRate([])).toBe(0);
    });
});

describe('weeklyPpc', () => {
    // Thursday 5 March 2026; its ISO week runs Mon 2 – Sun 8 March.
    const now = at(2026, 3, 5);

    it('buckets entries into ISO weeks, oldest first', () => {
        const series = weeklyPpc(
            entries([
                ['sobrecompromiso', 'si', at(2026, 2, 24)],
                ['sobrecompromiso', 'no', at(2026, 2, 25)],
                ['perfeccionismo', 'si', at(2026, 3, 3)],
                ['perfeccionismo', 'si', at(2026, 3, 4)],
            ]),
            { weeks: 2, now }
        );

        expect(series).toHaveLength(2);
        expect(series[0]?.entries).toBe(2);
        expect(series[0]?.result.ppc).toBe(50);
        expect(series[1]?.entries).toBe(2);
        expect(series[1]?.result.ppc).toBe(100);
        expect(series[1]?.weekNumber).toBe(10);
    });

    it('keeps weeks with no entries instead of closing the gap', () => {
        const series = weeklyPpc([entry({ at: now, adjustmentStatus: 'si' })], {
            weeks: 3,
            now,
        });

        expect(series).toHaveLength(3);
        expect(series[0]?.entries).toBe(0);
        expect(series[0]?.result.planned).toBe(0);
        expect(series[2]?.entries).toBe(1);
    });

    it('ignores entries older than the requested window', () => {
        const series = weeklyPpc([entry({ at: at(2025, 12, 1), adjustmentStatus: 'si' })], {
            weeks: 2,
            now,
        });

        expect(series.every((week) => week.entries === 0)).toBe(true);
    });
});

describe('adherence', () => {
    const now = at(2026, 3, 10);

    it('counts distinct days, not entries', () => {
        const result = adherence(
            entries([
                ['sobrecompromiso', 'si', at(2026, 3, 10, 9)],
                ['perfeccionismo', 'si', at(2026, 3, 10, 18)],
                ['gestion_energia', 'si', at(2026, 3, 9)],
            ]),
            { days: 10, now }
        );

        expect(result.daysLogged).toBe(2);
        expect(result.rate).toBe(20);
    });

    it('counts a streak ending today', () => {
        const result = adherence(
            entries([
                ['sobrecompromiso', 'si', at(2026, 3, 10)],
                ['sobrecompromiso', 'si', at(2026, 3, 9)],
                ['sobrecompromiso', 'si', at(2026, 3, 8)],
                ['sobrecompromiso', 'si', at(2026, 3, 6)],
            ]),
            { days: 30, now }
        );

        expect(result.streak).toBe(3);
    });

    it('does not break the streak just because today is not logged yet', () => {
        const result = adherence(
            entries([
                ['sobrecompromiso', 'si', at(2026, 3, 9)],
                ['sobrecompromiso', 'si', at(2026, 3, 8)],
            ]),
            { days: 30, now }
        );

        expect(result.streak).toBe(2);
    });

    it('is zero on an empty log', () => {
        const result = adherence([], { days: 30, now });

        expect(result.daysLogged).toBe(0);
        expect(result.rate).toBe(0);
        expect(result.streak).toBe(0);
    });
});
