import { describe, expect, it } from 'vitest';

import { weeklySynthesis } from './synthesis';
import { ROOT_CAUSES } from './taxonomy';
import { at, constraint, entries } from './fixtures';

// Thursday of ISO week 10, 2026 — the week runs Mon 2 to Sun 8 March.
const now = at(2026, 3, 5);

const thisWeek = entries([
    ['sobrecompromiso', 'si', at(2026, 3, 2)],
    ['sobrecompromiso', 'no', at(2026, 3, 3)],
    ['sobrecompromiso', 'si', at(2026, 3, 4)],
    ['perfeccionismo', 'no', at(2026, 3, 4, 15)],
]);

const lastWeek = entries([
    ['gestion_energia', 'si', at(2026, 2, 24)],
    ['gestion_energia', 'si', at(2026, 2, 25)],
]);

describe('weeklySynthesis', () => {
    it('scopes every figure to the week it labels', () => {
        const synthesis = weeklySynthesis([...lastWeek, ...thisWeek], [], now);

        expect(synthesis.weekNumber).toBe(10);
        expect(synthesis.entryCount).toBe(4);
        // The old panel counted dominant causes over the whole history while
        // calling them "esta semana"; last week's gestion_energia must not
        // appear here.
        expect(synthesis.dominant.map((row) => row.cause)).toEqual([
            'sobrecompromiso',
            'perfeccionismo',
        ]);
    });

    it('reports the week PPC and the week before it for comparison', () => {
        const synthesis = weeklySynthesis([...lastWeek, ...thisWeek], [], now);

        expect(synthesis.ppc.ppc).toBe(50);
        expect(synthesis.previousPpc?.ppc).toBe(100);
    });

    it('has no previous PPC when there is no history', () => {
        expect(weeklySynthesis(thisWeek, [], now).previousPpc).toBeNull();
    });

    it('derives the experiment from the dominant cause, not from a fixed string', () => {
        const synthesis = weeklySynthesis(thisWeek, [], now);

        expect(synthesis.experiment?.action).toBe(ROOT_CAUSES.sobrecompromiso.counterMeasure);
    });

    it('changes the experiment when the dominant cause changes', () => {
        const other = entries([
            ['distraccion_entorno', 'si', at(2026, 3, 2)],
            ['distraccion_entorno', 'no', at(2026, 3, 3)],
            ['distraccion_entorno', 'si', at(2026, 3, 4)],
        ]);

        expect(weeklySynthesis(other, [], now).experiment?.action).toBe(
            ROOT_CAUSES.distraccion_entorno.counterMeasure
        );
    });

    it('proposes no experiment for a week with no entries', () => {
        const synthesis = weeklySynthesis(lastWeek, [], now);

        expect(synthesis.entryCount).toBe(0);
        expect(synthesis.experiment).toBeNull();
        expect(synthesis.dominant).toEqual([]);
    });

    it('names the priority constraint and its age', () => {
        const synthesis = weeklySynthesis(
            thisWeek,
            [
                constraint({ id: 'c-1', status: 'activa', since: at(2026, 2, 11) }),
                constraint({ id: 'c-2', status: 'neutralizada', since: at(2026, 1, 1) }),
            ],
            now
        );

        expect(synthesis.priority?.id).toBe('c-1');
        expect(synthesis.priorityDays).toBe(22);
        expect(synthesis.openConstraints).toBe(1);
    });

    it('counts recurrence within the week', () => {
        const synthesis = weeklySynthesis(thisWeek, [], now);

        // Two of the four sobrecompromiso entries repeat inside the window.
        expect(synthesis.recurrence).toBe(50);
    });
});
