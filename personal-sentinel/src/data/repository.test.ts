import { describe, expect, it } from 'vitest';

import { isPersonalReading } from './repository';
import { generateReadings } from './generate';
import { WORKERS, manDownEpisodes } from '../domain';
import { at, reading } from '../domain/fixtures';

describe('isPersonalReading', () => {
    it('keeps another console rows out of this one charts', () => {
        expect(isPersonalReading(reading({ at: at(2026, 4, 6, 9) }))).toBe(true);
        expect(
            isPersonalReading({
                platform: 'industry',
                orgId: 'test-org',
                assetId: 'MACH-01',
                at: at(2026, 4, 6, 9),
                temperature: 55,
                vibration: 2.5,
                power: 4200,
                speed: 1700,
                oee: 88,
            })
        ).toBe(false);
    });
});

describe('generateReadings', () => {
    const options = { orgId: 'demo', days: 4, perDay: 24, now: at(2026, 4, 10, 12) };

    it('is deterministic, so a demonstration can be reproduced', () => {
        expect(generateReadings(options)).toEqual(generateReadings(options));
    });

    it('emits readings for every worker, in the typed schema', () => {
        const readings = generateReadings(options);

        expect(readings).toHaveLength(WORKERS.length * options.days * options.perDay);
        expect(readings.every(isPersonalReading)).toBe(true);
        // Named fields, not agro-sentinel's slots.
        expect(Object.keys(readings[0]!).sort()).toEqual([
            'assetId',
            'at',
            'bodyTemperature',
            'fatigue',
            'heartRate',
            'manDown',
            'orgId',
            'platform',
            'wearableBattery',
        ]);
    });

    it('writes manDown as a boolean, and almost always false', () => {
        const readings = generateReadings(options);

        expect(readings.every((entry) => typeof entry.manDown === 'boolean')).toBe(true);

        // The defect this migration fixes made every worked hour read as a
        // fall. A demonstration crew of five over four days must be mostly
        // fine, or the console is lying about the thing it exists to report.
        const down = readings.filter((entry) => entry.manDown).length;
        expect(down / readings.length).toBeLessThan(0.02);
        expect(manDownEpisodes(readings).length).toBeLessThan(6);
    });
});
