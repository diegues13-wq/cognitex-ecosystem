import { describe, expect, it } from 'vitest';

import { parseList, toRailAlert, toWorkOrder, toWorkOrderStatus } from './parse';

/**
 * These cover the two shape mismatches the audit found in this console. Both
 * were silent: nothing threw, nothing logged, the UI just showed the wrong
 * thing. A regression would be silent again, so it gets a test.
 */

describe('toRailAlert', () => {
    const NOW = new Date('2026-03-10T14:30:00').getTime();

    it('reads the canonical shape the API now emits', () => {
        const alert = toRailAlert(
            {
                id: 'ALT-001',
                orgId: 'acme',
                assetId: 'BRZ-001',
                assetName: 'Carajás 2001',
                at: NOW - 180_000,
                status: 'alert',
                category: 'MANTENIMIENTO',
                message: 'Rodamiento eje 3 en reparación.',
                acknowledgedAt: null,
            },
            NOW
        );

        expect(alert).toMatchObject({
            id: 'ALT-001',
            at: NOW - 180_000,
            status: 'alert',
            category: 'MANTENIMIENTO',
            assetId: 'BRZ-001',
        });
    });

    it('still reads the legacy {time, priority} shape', () => {
        // The ticker rendered a blank timestamp for every alert in this shape,
        // because it looked for `at` and the payload carried `time`.
        const alert = toRailAlert(
            {
                id: 'ALT-002',
                time: '14:27',
                type: 'PREDICTIVO',
                trainId: 'BRZ-003',
                trainName: 'Carajás 2003',
                message: 'Temperatura motor sobre baseline.',
                priority: 'CRITICAL',
            },
            NOW
        );

        expect(alert?.at).toBe(new Date('2026-03-10T14:27:00').getTime());
        expect(alert?.assetId).toBe('BRZ-003');
        expect(alert?.assetName).toBe('Carajás 2003');
        expect(alert?.category).toBe('PREDICTIVO');
    });

    it("maps legacy CRITICAL onto the shared 'alert' status", () => {
        // CCOView filtered on `priority === 'CRITICAL'`; anything that did not
        // produce a comparable status meant the critical count read zero
        // during an actual critical alert.
        expect(toRailAlert({ id: 'a', priority: 'CRITICAL' }, NOW)?.status).toBe('alert');
        expect(toRailAlert({ id: 'b', priority: 'WARNING' }, NOW)?.status).toBe('warning');
        expect(toRailAlert({ id: 'c', priority: 'INFO' }, NOW)?.status).toBe('ok');
    });

    it('treats a clock reading from the future as yesterday', () => {
        const alert = toRailAlert({ id: 'a', time: '23:50' }, NOW);
        expect(alert?.at).toBeLessThan(NOW);
    });

    it('gives a network-wide alert an empty assetId rather than null', () => {
        const alert = toRailAlert({ id: 'a', trainId: null, message: 'Red operativa' }, NOW);
        expect(alert?.assetId).toBe('');
        expect(alert?.assetName).toBeNull();
    });

    it('drops anything without an id instead of rendering a blank row', () => {
        expect(toRailAlert({ message: 'huérfana' })).toBeNull();
        expect(toRailAlert(null)).toBeNull();
        expect(toRailAlert('ALT-001')).toBeNull();
    });
});

describe('toWorkOrderStatus', () => {
    it('folds every spelling of "in progress" onto EN_CURSO', () => {
        // WorkOrderCard only knew EN_CURSO, so an order emitted as EN_PROGRESO
        // fell through to the PENDIENTE icon — work in progress looked
        // untouched on the maintenance board.
        expect(toWorkOrderStatus('EN_CURSO')).toBe('EN_CURSO');
        expect(toWorkOrderStatus('EN_PROGRESO')).toBe('EN_CURSO');
        expect(toWorkOrderStatus('en progreso')).toBe('EN_CURSO');
    });

    it('falls back to PENDIENTE for an unknown status', () => {
        expect(toWorkOrderStatus('QUIEN_SABE')).toBe('PENDIENTE');
        expect(toWorkOrderStatus(undefined)).toBe('PENDIENTE');
    });
});

describe('toWorkOrder', () => {
    it('normalises status and keeps nullable predictions nullable', () => {
        const order = toWorkOrder({
            id: 'WO-2026-0143',
            assetId: 'BRZ-001',
            type: 'CORRECTIVO',
            priority: 'ALTA',
            status: 'EN_PROGRESO',
            component: 'Bogie — Rodamiento eje 3',
            triggerType: 'COND',
            triggerValue: null,
            currentValue: null,
            estimatedHours: 12,
            depot: 'São Luís Terminal',
            scheduledDate: '2026-03-10',
            aiPredictedFailureDate: '2026-03-10',
            remainingLifePct: 5,
            aiConfidencePct: 97,
        });

        expect(order?.status).toBe('EN_CURSO');
        expect(order?.triggerValue).toBeNull();
        expect(order?.remainingLifePct).toBe(5);
    });

    it('keeps a zero reading rather than treating it as missing', () => {
        const order = toWorkOrder({ id: 'WO-1', remainingLifePct: 0, currentValue: 0 });
        expect(order?.remainingLifePct).toBe(0);
        expect(order?.currentValue).toBe(0);
    });
});

describe('parseList', () => {
    it('skips unparseable rows instead of failing the whole response', () => {
        const orders = parseList([{ id: 'WO-1' }, null, { noId: true }, { id: 'WO-2' }], toWorkOrder);
        expect(orders.map((order) => order.id)).toEqual(['WO-1', 'WO-2']);
    });

    it('returns an empty list when the response is not an array', () => {
        expect(parseList({ error: 'boom' }, toWorkOrder)).toEqual([]);
    });
});
