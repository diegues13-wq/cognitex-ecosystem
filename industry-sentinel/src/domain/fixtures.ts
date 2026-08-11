import type { IndustryReading } from '@cognitex/data';

import { DEFAULT_MACHINE } from './machines';

/**
 * Test fixtures.
 *
 * Outside a `.test.ts` file so several suites share them, and typed against
 * `IndustryReading` so a change to the schema breaks the fixtures rather than
 * the assertions.
 *
 * Timestamps are built from local `Date` components, never UTC literals, so
 * the shift calculations give the same answers in Quito and in CI.
 */

export function at(year: number, month: number, day: number, hour = 9, minute = 0): number {
    return new Date(year, month - 1, day, hour, minute, 0, 0).getTime();
}

export function reading(overrides: Partial<IndustryReading> & { at: number }): IndustryReading {
    return {
        platform: 'industry',
        orgId: 'test-org',
        assetId: DEFAULT_MACHINE.id,
        temperature: 55,
        vibration: 2.5,
        power: 4200,
        speed: 1700,
        oee: 88,
        ...overrides,
    };
}

/** A run of readings one hour apart, starting at `from`. */
export function hourly(
    from: number,
    count: number,
    shape: (index: number) => Partial<IndustryReading> = () => ({})
): IndustryReading[] {
    return Array.from({ length: count }, (_unused, index) =>
        reading({ at: from + index * 3_600_000, ...shape(index) })
    );
}
