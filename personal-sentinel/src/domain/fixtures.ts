import type { PersonalReading } from '@cognitex/data';

import { DEFAULT_WORKER } from './workers';

/**
 * Test fixtures.
 *
 * Outside a `.test.ts` file so several suites share them, and typed against
 * `PersonalReading` so a change to the schema breaks the fixtures rather than
 * the assertions.
 *
 * Timestamps are built from local `Date` components, never UTC literals, so
 * the shift calculations give the same answers in Quito and in CI.
 */

export function at(year: number, month: number, day: number, hour = 9, minute = 0): number {
    return new Date(year, month - 1, day, hour, minute, 0, 0).getTime();
}

export function reading(overrides: Partial<PersonalReading> & { at: number }): PersonalReading {
    return {
        platform: 'personal',
        orgId: 'test-org',
        assetId: DEFAULT_WORKER.id,
        heartRate: 82,
        fatigue: 20,
        bodyTemperature: 36.8,
        wearableBattery: 85,
        // The default is the safe state, and it is a boolean. The generator
        // this replaces wrote `co2: isWorking ? 1 : 0`, so its safe state was
        // whichever of 0 and 1 the reader happened to assume.
        manDown: false,
        ...overrides,
    };
}

/** A run of readings one hour apart, starting at `from`. */
export function hourly(
    from: number,
    count: number,
    shape: (index: number) => Partial<PersonalReading> = () => ({})
): PersonalReading[] {
    return Array.from({ length: count }, (_unused, index) =>
        reading({ at: from + index * 3_600_000, ...shape(index) })
    );
}
