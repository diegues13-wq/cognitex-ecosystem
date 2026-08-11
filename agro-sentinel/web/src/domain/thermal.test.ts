import { describe, expect, it } from 'vitest';

import { gradeDelta, interpretScan, summariseScans } from './thermal';
import { T0 } from './fixtures';
import type { ThermalScan } from './types';

function scan(overrides: Partial<ThermalScan> = {}): ThermalScan {
    return {
        id: 'scan-1',
        farmId: 'GH-AMB-01',
        at: T0,
        maxTemperature: 42.5,
        ambientTemperature: 22,
        anomaly: true,
        description: 'Punto caliente en el cuadrante superior derecho',
        stub: false,
        ...overrides,
    };
}

describe('gradeDelta', () => {
    it('follows the ΔT-over-ambient bands', () => {
        expect(gradeDelta(2)).toBe('normal');
        expect(gradeDelta(7)).toBe('watch');
        expect(gradeDelta(15)).toBe('probable');
        expect(gradeDelta(25)).toBe('act');
    });

    it('is unknown without an ambient reading, not normal', () => {
        expect(gradeDelta(null)).toBe('unknown');
        expect(gradeDelta(Number.NaN)).toBe('unknown');
    });

    it('puts the band edges on the documented side', () => {
        expect(gradeDelta(3)).toBe('normal');
        expect(gradeDelta(10)).toBe('watch');
        expect(gradeDelta(20)).toBe('probable');
    });
});

describe('interpretScan', () => {
    it('computes ΔT against the air temperature at that moment', () => {
        const finding = interpretScan(scan({ maxTemperature: 42.5, ambientTemperature: 22 }));

        expect(finding.delta).toBeCloseTo(20.5, 6);
        expect(finding.grade).toBe('act');
    });

    it('grades a scan with no ambient as unknown and says why', () => {
        const finding = interpretScan(scan({ ambientTemperature: null }));

        expect(finding.grade).toBe('unknown');
        expect(finding.verdict).toContain('ambiente');
    });
});

describe('summariseScans', () => {
    it('picks the worst finding', () => {
        const summary = summariseScans([
            scan({ id: 'a', maxTemperature: 24 }),
            scan({ id: 'b', maxTemperature: 48 }),
            scan({ id: 'c', maxTemperature: 30 }),
        ]);

        expect(summary.worst?.scan.id).toBe('b');
        expect(summary.total).toBe(3);
    });

    it('counts how many scans came from the stub', () => {
        const summary = summariseScans([scan({ id: 'a', stub: true }), scan({ id: 'b' })]);

        expect(summary.stubbed).toBe(1);
    });

    it('notices that every scan reports the same temperature', () => {
        // cloud/thermal.py:79 returns 42.5 °C for every image it is given.
        const summary = summariseScans([
            scan({ id: 'a', maxTemperature: 42.5, stub: true }),
            scan({ id: 'b', maxTemperature: 42.5, stub: true }),
            scan({ id: 'c', maxTemperature: 42.5, stub: true }),
        ]);

        expect(summary.identicalReadings).toBe(true);
    });

    it('does not call a single scan identical to itself', () => {
        expect(summariseScans([scan()]).identicalReadings).toBe(false);
    });

    it('is empty-safe', () => {
        expect(summariseScans([])).toMatchObject({
            total: 0,
            stubbed: 0,
            worst: null,
            identicalReadings: false,
        });
    });
});
