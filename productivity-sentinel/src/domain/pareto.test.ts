import { describe, expect, it } from 'vitest';

import { pareto, vitalFew } from './pareto';
import { at, entries } from './fixtures';
import type { RootCause } from './types';

function log(counts: Partial<Record<RootCause, number>>) {
    const specs: [RootCause, 'si', number][] = [];
    let day = 1;

    for (const [cause, count] of Object.entries(counts) as [RootCause, number][]) {
        for (let index = 0; index < count; index += 1) {
            specs.push([cause, 'si', at(2026, 3, 1, 8) + day * 3_600_000]);
            day += 1;
        }
    }

    return entries(specs);
}

describe('pareto', () => {
    it('ranks causes by frequency, most frequent first', () => {
        const rows = pareto(
            log({ sobrecompromiso: 5, perfeccionismo: 3, gestion_energia: 2 })
        );

        expect(rows.map((row) => row.cause)).toEqual([
            'sobrecompromiso',
            'perfeccionismo',
            'gestion_energia',
        ]);
        expect(rows.map((row) => row.rank)).toEqual([1, 2, 3]);
    });

    it('accumulates share down the ranking to exactly 100', () => {
        const rows = pareto(log({ sobrecompromiso: 5, perfeccionismo: 3, gestion_energia: 2 }));

        expect(rows[0]?.share).toBe(50);
        expect(rows[0]?.cumulative).toBe(50);
        expect(rows[1]?.cumulative).toBe(80);
        expect(rows.at(-1)?.cumulative).toBeCloseTo(100, 10);
    });

    it('does not round, so shares still sum to the cumulative', () => {
        const rows = pareto(log({ sobrecompromiso: 1, perfeccionismo: 1, gestion_energia: 1 }));

        expect(rows[0]?.share).toBeCloseTo(33.3333, 3);
        // Rounding each share to 33 and adding them gave 99 in the old panel.
        const summed = rows.reduce((total, row) => total + row.share, 0);
        expect(summed).toBeCloseTo(100, 10);
    });

    it('breaks ties by taxonomy order, not by insertion order', () => {
        const forwards = pareto(log({ perfeccionismo: 2, sobrecompromiso: 2 }));
        const backwards = pareto(log({ sobrecompromiso: 2, perfeccionismo: 2 }));

        // sobrecompromiso is declared first in ROOT_CAUSE_IDS.
        expect(forwards.map((row) => row.cause)).toEqual(['sobrecompromiso', 'perfeccionismo']);
        expect(backwards.map((row) => row.cause)).toEqual(forwards.map((row) => row.cause));
    });

    it('finds the vital few instead of assuming the top two', () => {
        // One cause already explains 90%: it alone is the vital few.
        const rows = pareto(log({ sobrecompromiso: 9, perfeccionismo: 1 }));

        expect(vitalFew(rows).map((row) => row.cause)).toEqual(['sobrecompromiso']);
    });

    it('includes the row that crosses 80% and nothing after it', () => {
        const rows = pareto(
            log({
                sobrecompromiso: 4,
                evitacion_conflicto: 3,
                falta_descomposicion: 2,
                gestion_energia: 1,
            })
        );

        expect(rows[1]?.cumulative).toBe(70);
        expect(rows[2]?.cumulative).toBe(90);
        expect(vitalFew(rows).map((row) => row.cause)).toEqual([
            'sobrecompromiso',
            'evitacion_conflicto',
            'falta_descomposicion',
        ]);
    });

    it('widens the vital few when the spread is flat', () => {
        // Five causes at 20% each: the cumulative reaches exactly 80 on the
        // fourth, so four causes are vital and the fifth is not.
        const rows = pareto(
            log({
                sobrecompromiso: 1,
                evitacion_conflicto: 1,
                falta_descomposicion: 1,
                gestion_energia: 1,
                distraccion_entorno: 1,
            })
        );

        expect(rows[3]?.cumulative).toBe(80);
        expect(vitalFew(rows)).toHaveLength(4);
    });

    it('is empty for an empty log rather than dividing by zero', () => {
        expect(pareto([])).toEqual([]);
    });

    it('omits causes that never occurred', () => {
        const rows = pareto(log({ sobrecompromiso: 3 }));

        expect(rows).toHaveLength(1);
        expect(rows[0]?.label).toBe('Sobrecompromiso');
    });
});
