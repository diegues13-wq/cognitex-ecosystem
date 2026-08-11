import type { GreenhouseSample, Millis } from './types';

/**
 * Test data.
 *
 * `nominal` sits comfortably inside every WARNING band, so any alarm a test
 * sees is one that test asked for. Times are explicit — no test in here reads
 * the wall clock, because a suite that depends on the hour it runs at is a
 * suite that fails at 23:00 in Quito.
 */

/** 10 March 2026, 12:00 UTC. Arbitrary, fixed, and inside no DST transition. */
export const T0: Millis = Date.UTC(2026, 2, 10, 12, 0, 0);

/** Minutes after T0, as milliseconds. */
export function at(minutes: number): Millis {
    return T0 + minutes * 60_000;
}

export function sample(overrides: Partial<GreenhouseSample> = {}): GreenhouseSample {
    return {
        platform: 'agro',
        orgId: 'demo',
        assetId: 'GH-AMB-01',
        at: T0,
        airTemperature: 22,
        humidity: 70,
        vpd: 0.79,
        co2: 800,
        soilMoisture: 60,
        par: 500,
        batteryPct: 90,
        rssiDbm: -60,
        soilEc: 1.3,
        soilTemperature: 20,
        ...overrides,
    };
}

/** A series at one-minute spacing, each entry overriding the nominal sample. */
export function series(steps: readonly Partial<GreenhouseSample>[]): GreenhouseSample[] {
    return steps.map((step, index) => sample({ at: at(index), ...step }));
}
