import { describe, expect, it } from 'vitest';

import { computeOee, oeeConsistency, plantOee } from './oee';
import { MACHINES, PRODUCTION_SHIFT, findMachine } from './machines';
import { at, hourly, reading } from './fixtures';

const lathe = findMachine('MACH-01')!;
const press = findMachine('MACH-02')!;

describe('computeOee', () => {
    it('counts availability against scheduled time only', () => {
        // Ten scheduled hours from 08:00; the machine is stopped for two.
        const readings = hourly(at(2026, 4, 6, 8), 10, (index) =>
            index < 2 ? { speed: 0, oee: 0 } : { speed: 1800, oee: 90 }
        );

        const result = computeOee(readings, lathe, PRODUCTION_SHIFT);

        expect(result.scheduledSamples).toBe(10);
        expect(result.runningSamples).toBe(8);
        expect(result.availability).toBe(80);
    });

    it('ignores readings outside the shift, so a closed plant is not downtime', () => {
        // 02:00 to 06:00 — four readings, all outside 06:00-22:00.
        const readings = hourly(at(2026, 4, 6, 2), 4, () => ({ speed: 0, oee: 0 }));

        const result = computeOee(readings, lathe, PRODUCTION_SHIFT);

        expect(result.scheduledSamples).toBe(0);
        expect(result.availability).toBe(0);
        expect(result.reportedOee).toBeNull();
    });

    it('rates performance against the machine rated speed', () => {
        const readings = hourly(at(2026, 4, 6, 8), 4, () => ({ speed: 900, oee: 50 }));

        // 900 of 1800 rpm.
        expect(computeOee(readings, lathe, PRODUCTION_SHIFT).performance).toBe(50);
        // Same rpm on a machine rated 1200 is a different performance figure —
        // the thing a single hardcoded threshold could not express.
        expect(computeOee(readings, press, PRODUCTION_SHIFT).performance).toBe(75);
    });

    it('has no performance figure when nothing ran', () => {
        const readings = hourly(at(2026, 4, 6, 8), 4, () => ({ speed: 0, oee: 0 }));

        const result = computeOee(readings, lathe, PRODUCTION_SHIFT);

        expect(result.performance).toBeNull();
        expect(result.impliedQuality).toBeNull();
        // A real zero, distinguishable from "no scheduled time" by the count.
        expect(result.availability).toBe(0);
        expect(result.scheduledSamples).toBe(4);
    });

    it('averages the reported OEE over scheduled time, so stops count against it', () => {
        const readings = hourly(at(2026, 4, 6, 8), 4, (index) =>
            index === 0 ? { speed: 0, oee: 0 } : { speed: 1800, oee: 80 }
        );

        // (0 + 80 + 80 + 80) / 4, not the mean of the running samples.
        expect(computeOee(readings, lathe, PRODUCTION_SHIFT).reportedOee).toBe(60);
    });

    it('back-computes quality from availability, performance and reported OEE', () => {
        // 80% available, 90% of rated speed, MES reports 64.8 → quality 90.
        const readings = hourly(at(2026, 4, 6, 8), 10, (index) =>
            index < 2 ? { speed: 0, oee: 0 } : { speed: 1620, oee: 81 }
        );

        const result = computeOee(readings, lathe, PRODUCTION_SHIFT);

        expect(result.availability).toBe(80);
        expect(result.performance).toBeCloseTo(90, 6);
        expect(result.reportedOee).toBeCloseTo(64.8, 6);
        expect(result.impliedQuality).toBeCloseTo(90, 4);
    });

    it('preserves a zero OEE as a measurement rather than absent data', () => {
        const readings = hourly(at(2026, 4, 6, 8), 3, () => ({ speed: 1800, oee: 0 }));

        // Legitimately zero: the line turned but produced nothing good.
        expect(computeOee(readings, lathe, PRODUCTION_SHIFT).reportedOee).toBe(0);
    });
});

describe('oeeConsistency', () => {
    it('flags a reported OEE the telemetry cannot account for', () => {
        // Half available, half speed, but the MES claims 90.
        const readings = hourly(at(2026, 4, 6, 8), 4, (index) =>
            index < 2 ? { speed: 0, oee: 90 } : { speed: 900, oee: 90 }
        );

        const result = computeOee(readings, lathe, PRODUCTION_SHIFT);

        expect(result.impliedQuality).toBeGreaterThan(100);
        expect(oeeConsistency(result)).toBe('inconsistente');
    });

    it('says so when there is nothing to check against', () => {
        const idle = computeOee(
            hourly(at(2026, 4, 6, 8), 2, () => ({ speed: 0, oee: 0 })),
            lathe,
            PRODUCTION_SHIFT
        );

        expect(oeeConsistency(idle)).toBe('desconocida');
    });
});

describe('plantOee', () => {
    it('weights machines by their sample count rather than averaging averages', () => {
        const readings = [
            // Six readings from the lathe, all running.
            ...hourly(at(2026, 4, 6, 8), 6, () => ({ speed: 1800, oee: 90 })),
            // Two from the press, both stopped.
            ...hourly(at(2026, 4, 6, 8), 2, () => ({
                assetId: press.id,
                speed: 0,
                oee: 0,
            })),
        ];

        const result = plantOee(readings, MACHINES, PRODUCTION_SHIFT);

        expect(result.scheduledSamples).toBe(8);
        expect(result.runningSamples).toBe(6);
        expect(result.availability).toBe(75);
        // A mean of means would be (90 + 0) / 2 = 45.
        expect(result.reportedOee).toBeCloseTo(67.5, 6);
    });

    it('ignores machines that reported nothing instead of scoring them zero', () => {
        const readings = hourly(at(2026, 4, 6, 8), 4, () => ({ speed: 1800, oee: 92 }));

        const result = plantOee(readings, MACHINES, PRODUCTION_SHIFT);

        expect(result.scheduledSamples).toBe(4);
        expect(result.availability).toBe(100);
        expect(result.reportedOee).toBe(92);
    });

    it('reports an empty plant as having no scheduled time', () => {
        const result = plantOee([reading({ at: at(2026, 4, 6, 3) })], MACHINES, PRODUCTION_SHIFT);

        expect(result.scheduledSamples).toBe(0);
        expect(result.reportedOee).toBeNull();
    });
});
