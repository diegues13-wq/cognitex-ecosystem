import { describe, expect, it } from 'vitest';

import { inferSampleMs, isIndustryReading } from './repository';
import { generateReadings } from './generate';
import { MACHINES, PRODUCTION_SHIFT, HOUR_MS, reliability } from '../domain';
import { at, hourly, reading } from '../domain/fixtures';

describe('inferSampleMs', () => {
    it('measures the feed interval rather than assuming it', () => {
        // MTBF is a duration. Assuming an interval the gateway does not use
        // scales every reliability figure by whatever the ratio happens to be.
        expect(inferSampleMs(hourly(at(2026, 4, 6, 8), 6), 999)).toBe(HOUR_MS);
    });

    it('takes the median, so one overnight gap does not stretch the estimate', () => {
        const readings = [
            ...hourly(at(2026, 4, 6, 8), 5),
            // A twelve-hour hole, then the feed resumes.
            ...hourly(at(2026, 4, 7, 0), 4),
        ];

        expect(inferSampleMs(readings, 999)).toBe(HOUR_MS);
    });

    it('measures each asset separately, not the interleaved stream', () => {
        // Two machines an hour apart each, offset by half an hour. Reading the
        // merged stream would infer thirty minutes.
        const readings = [
            ...hourly(at(2026, 4, 6, 8), 4),
            ...hourly(at(2026, 4, 6, 8, 30), 4, () => ({ assetId: 'MACH-02' })),
        ];

        expect(inferSampleMs(readings, 999)).toBe(HOUR_MS);
    });

    it('falls back when there is nothing to measure', () => {
        expect(inferSampleMs([], 4242)).toBe(4242);
        expect(inferSampleMs([reading({ at: at(2026, 4, 6, 8) })], 4242)).toBe(4242);
    });
});

describe('isIndustryReading', () => {
    it('keeps another console rows out of this one charts', () => {
        expect(isIndustryReading(reading({ at: at(2026, 4, 6, 8) }))).toBe(true);
        expect(
            isIndustryReading({
                platform: 'personal',
                orgId: 'test-org',
                assetId: 'WRK-001',
                at: at(2026, 4, 6, 8),
                heartRate: 80,
                fatigue: 10,
                bodyTemperature: 36.8,
                wearableBattery: 90,
                manDown: false,
            })
        ).toBe(false);
    });
});

describe('generateReadings', () => {
    const options = { orgId: 'demo', days: 3, perDay: 12, now: at(2026, 4, 10, 12) };

    it('is deterministic, so a demonstration can be reproduced', () => {
        expect(generateReadings(options)).toEqual(generateReadings(options));
    });

    it('emits readings for every machine, in the typed schema', () => {
        const readings = generateReadings(options);

        expect(readings).toHaveLength(MACHINES.length * options.days * options.perDay);
        expect(readings.every(isIndustryReading)).toBe(true);
        // Named fields, not agro-sentinel's slots.
        expect(Object.keys(readings[0]!).sort()).toEqual([
            'assetId',
            'at',
            'oee',
            'orgId',
            'platform',
            'power',
            'speed',
            'temperature',
            'vibration',
        ]);
    });

    it('produces a plant that stops sometimes, so downtime is measurable', () => {
        const readings = generateReadings({ ...options, days: 10 });
        const result = reliability(readings, {
            shift: PRODUCTION_SHIFT,
            sampleMs: 86_400_000 / options.perDay,
        });

        expect(result.availability).toBeGreaterThan(0);
        expect(result.availability).toBeLessThan(100);
    });
});
