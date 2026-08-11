import { describe, expect, it } from 'vitest';

import { activeAlerts, deriveAlerts } from './alarms';
import { HOUR_MS } from './shift';
import { at, hourly, reading } from './fixtures';

describe('deriveAlerts', () => {
    const now = at(2026, 4, 6, 10);

    it('emits the shared alert shape, with a timestamp and a status', () => {
        const alerts = deriveAlerts([reading({ at: now, temperature: 120 })], 'org-1');

        expect(alerts).toHaveLength(1);
        expect(alerts[0]).toMatchObject({
            orgId: 'org-1',
            assetId: 'MACH-01',
            at: now,
            status: 'alert',
            acknowledgedAt: null,
        });
        // `{time, priority}` versus `{timestamp, severity}` is the pair that
        // rendered a blank time and a filter that matched nothing.
        expect(alerts[0]?.message).toContain('sobrecalentamiento');
    });

    it('grades an overload as a warning and a thermal fault as an alert', () => {
        const alerts = deriveAlerts(
            [reading({ at: now, power: 9000 }), reading({ at: now + 1, temperature: 120 })],
            'org-1'
        );

        expect(alerts.find((alert) => alert.message.includes('sobrecarga'))?.status).toBe(
            'warning'
        );
        expect(
            alerts.find((alert) => alert.message.includes('sobrecalentamiento'))?.status
        ).toBe('alert');
    });

    it('gives the same breach the same id twice, so re-deriving does not duplicate', () => {
        const readings = [reading({ at: now, vibration: 9 })];

        expect(deriveAlerts(readings, 'org-1')[0]?.id).toBe(
            deriveAlerts(readings, 'org-1')[0]?.id
        );
    });

    it('says nothing about a stopped machine', () => {
        // Vibration and temperature at rest are not faults.
        const alerts = deriveAlerts(
            [reading({ at: now, speed: 0, temperature: 0, vibration: 0, power: 0 })],
            'org-1'
        );

        expect(alerts).toEqual([]);
    });

    it('ignores readings from an asset the plant does not know', () => {
        const alerts = deriveAlerts(
            [reading({ at: now, assetId: 'GHOST-01', temperature: 500 })],
            'org-1'
        );

        expect(alerts).toEqual([]);
    });

    it('returns the newest breaches first and caps the list', () => {
        const readings = hourly(at(2026, 4, 6, 8), 6, () => ({ temperature: 120 }));

        const alerts = deriveAlerts(readings, 'org-1', 3);

        expect(alerts).toHaveLength(3);
        expect(alerts[0]!.at).toBeGreaterThan(alerts[1]!.at);
    });
});

describe('activeAlerts', () => {
    const now = at(2026, 4, 6, 12);

    it('drops acknowledged alarms and anything older than the window', () => {
        const alerts = deriveAlerts(
            [
                reading({ at: now - HOUR_MS, temperature: 120 }),
                reading({ at: now - 40 * HOUR_MS, temperature: 120 }),
            ],
            'org-1'
        );
        const acknowledged = [
            ...alerts,
            { ...alerts[0]!, id: 'ack', acknowledgedAt: now },
        ];

        const active = activeAlerts(acknowledged, { now, windowMs: 24 * HOUR_MS });

        expect(active).toHaveLength(1);
        expect(active[0]?.at).toBe(now - HOUR_MS);
    });

    it('is empty rather than undefined when nothing is active', () => {
        expect(activeAlerts([], { now, windowMs: HOUR_MS })).toEqual([]);
    });
});
