import { describe, expect, it } from 'vitest';

import {
    IllegalTransitionError,
    allowedTransitions,
    canTransition,
    daysInStatus,
    priorityConstraint,
    tallyConstraints,
    transitionConstraint,
} from './constraints';
import { at, constraint } from './fixtures';

describe('constraint transitions', () => {
    it('opens an experiment on an active constraint', () => {
        expect(canTransition('activa', 'en_experimento')).toBe(true);
    });

    it('closes an experiment that worked', () => {
        expect(canTransition('en_experimento', 'neutralizada')).toBe(true);
    });

    it('reopens an experiment that did not work', () => {
        expect(canTransition('en_experimento', 'activa')).toBe(true);
    });

    it('reopens a neutralised constraint that came back', () => {
        expect(canTransition('neutralizada', 'activa')).toBe(true);
    });

    it('refuses to declare a constraint solved without an experiment', () => {
        expect(canTransition('activa', 'neutralizada')).toBe(false);
    });

    it('refuses to send a neutralised constraint straight into an experiment', () => {
        expect(canTransition('neutralizada', 'en_experimento')).toBe(false);
    });

    it('offers exactly the legal moves', () => {
        expect(allowedTransitions('activa')).toEqual(['en_experimento']);
        expect(allowedTransitions('en_experimento')).toEqual(['neutralizada', 'activa']);
        expect(allowedTransitions('neutralizada')).toEqual(['activa']);
    });
});

describe('transitionConstraint', () => {
    const now = at(2026, 3, 10);

    it('restarts the clock on a legal move', () => {
        const before = constraint({ id: 'c-1', since: at(2026, 2, 1) });
        const after = transitionConstraint(before, 'en_experimento', now);

        expect(after.status).toBe('en_experimento');
        expect(after.since).toBe(now);
    });

    it('does not mutate the input', () => {
        const before = constraint({ id: 'c-1' });
        transitionConstraint(before, 'en_experimento', now);

        expect(before.status).toBe('activa');
    });

    it('throws on an illegal move rather than silently doing nothing', () => {
        const before = constraint({ id: 'c-1', status: 'activa' });

        expect(() => transitionConstraint(before, 'neutralizada', now)).toThrow(
            IllegalTransitionError
        );
    });

    it('treats a move to the current status as a no-op, not an error', () => {
        const before = constraint({ id: 'c-1', status: 'activa' });

        expect(transitionConstraint(before, 'activa', now)).toBe(before);
    });
});

describe('daysInStatus', () => {
    it('derives the age from `since` so it cannot go stale', () => {
        const item = constraint({ id: 'c-1', since: at(2026, 3, 1) });

        expect(daysInStatus(item, at(2026, 3, 23))).toBe(22);
    });

    it('never reports a negative age for a clock skewed into the future', () => {
        const item = constraint({ id: 'c-1', since: at(2026, 4, 1) });

        expect(daysInStatus(item, at(2026, 3, 1))).toBe(0);
    });
});

describe('priorityConstraint', () => {
    const now = at(2026, 3, 20);

    it('prefers an active constraint over one already under experiment', () => {
        const chosen = priorityConstraint(
            [
                constraint({
                    id: 'c-exp',
                    status: 'en_experimento',
                    goalIds: ['goal-ppc', 'goal-energy', 'goal-recurrence'],
                    since: at(2026, 1, 1),
                }),
                constraint({ id: 'c-act', status: 'activa', since: at(2026, 3, 18) }),
            ],
            now
        );

        expect(chosen?.id).toBe('c-act');
    });

    it('breaks ties by how many goals a constraint blocks', () => {
        const chosen = priorityConstraint(
            [
                constraint({ id: 'c-one', goalIds: ['goal-ppc'], since: at(2026, 1, 1) }),
                constraint({
                    id: 'c-two',
                    goalIds: ['goal-ppc', 'goal-energy'],
                    since: at(2026, 3, 19),
                }),
            ],
            now
        );

        expect(chosen?.id).toBe('c-two');
    });

    it('then breaks ties by age', () => {
        const chosen = priorityConstraint(
            [
                constraint({ id: 'c-new', since: at(2026, 3, 19) }),
                constraint({ id: 'c-old', since: at(2026, 1, 5) }),
            ],
            now
        );

        expect(chosen?.id).toBe('c-old');
    });

    it('ignores neutralised constraints', () => {
        const chosen = priorityConstraint(
            [constraint({ id: 'c-done', status: 'neutralizada' })],
            now
        );

        expect(chosen).toBeNull();
    });

    it('is null on an empty board', () => {
        expect(priorityConstraint([], now)).toBeNull();
    });
});

describe('tallyConstraints', () => {
    it('counts open constraints as active plus under experiment', () => {
        const tally = tallyConstraints([
            constraint({ id: 'a', status: 'activa' }),
            constraint({ id: 'b', status: 'en_experimento' }),
            constraint({ id: 'c', status: 'neutralizada' }),
            constraint({ id: 'd', status: 'neutralizada' }),
        ]);

        expect(tally).toEqual({
            activa: 1,
            en_experimento: 1,
            neutralizada: 2,
            open: 2,
        });
    });

    it('returns zeros, not undefined, for an empty board', () => {
        expect(tallyConstraints([]).open).toBe(0);
    });
});
