import { describe, expect, it } from 'vitest';

import {
    DAY_MS,
    botrytisRisk,
    dailyLightIntegral,
    dailyTemperature,
    farmDayKey,
    growingDegreeDays,
    startOfFarmDay,
} from './agronomy';
import { T0, sample } from './fixtures';

describe('farm days', () => {
    it('buckets by Ecuadorian local time, whatever the machine is set to', () => {
        // 2026-03-11T03:00Z is 2026-03-10, 22:00 in Ecuador.
        expect(farmDayKey(Date.UTC(2026, 2, 11, 3, 0))).toBe('2026-03-10');
        // 2026-03-11T05:00Z is midnight of the 11th there.
        expect(farmDayKey(Date.UTC(2026, 2, 11, 5, 0))).toBe('2026-03-11');
    });

    it('starts the day at 05:00 UTC, Ecuador having no daylight saving', () => {
        expect(startOfFarmDay(Date.UTC(2026, 2, 10, 18, 30))).toBe(Date.UTC(2026, 2, 10, 5, 0));
    });
});

describe('dailyTemperature', () => {
    const samples = [
        sample({ at: T0, airTemperature: 18 }),
        sample({ at: T0 + 3_600_000, airTemperature: 26 }),
        sample({ at: T0 + 7_200_000, airTemperature: 22 }),
        sample({ at: T0 + DAY_MS, airTemperature: 12 }),
    ];

    it('reduces a day of readings to its extremes', () => {
        const days = dailyTemperature(samples);

        expect(days).toHaveLength(2);
        expect(days[0]).toMatchObject({ min: 18, max: 26, count: 3 });
        expect(days[0]?.mean).toBeCloseTo(22, 6);
    });

    it('omits days with no readings instead of inventing a 0 °C night', () => {
        const withGap = [sample({ at: T0 }), sample({ at: T0 + 5 * DAY_MS })];

        expect(dailyTemperature(withGap)).toHaveLength(2);
    });

    it('is empty for an empty window', () => {
        expect(dailyTemperature([])).toEqual([]);
    });
});

describe('growingDegreeDays', () => {
    it('uses the daily mean against the base, McMaster & Wilhelm method 1', () => {
        // (30 + 10) / 2 − 10 = 10 degree-days.
        const result = growingDegreeDays(
            [
                sample({ at: T0, airTemperature: 30 }),
                sample({ at: T0 + 3_600_000, airTemperature: 10 }),
            ],
            10
        );

        expect(result.total).toBeCloseTo(10, 6);
        expect(result.days).toHaveLength(1);
    });

    it('never accumulates a negative day', () => {
        const result = growingDegreeDays(
            [
                sample({ at: T0, airTemperature: 6 }),
                sample({ at: T0 + 3_600_000, airTemperature: 2 }),
            ],
            10
        );

        expect(result.total).toBe(0);
    });

    it('accumulates across days', () => {
        const result = growingDegreeDays(
            [
                sample({ at: T0, airTemperature: 30 }),
                sample({ at: T0 + 3_600_000, airTemperature: 10 }),
                sample({ at: T0 + DAY_MS, airTemperature: 26 }),
                sample({ at: T0 + DAY_MS + 3_600_000, airTemperature: 14 }),
            ],
            10
        );

        expect(result.days.map((day) => day.gdd)).toEqual([10, 10]);
        expect(result.total).toBe(20);
    });

    it('reports the base it used, because the number is meaningless without it', () => {
        expect(growingDegreeDays([], 12).base).toBe(12);
    });

    it('does not depend on how often the sensor reported', () => {
        // The same day sampled twice and sampled twenty-five times has the
        // same daily mean, so the same GDD. The old per-reading accumulation
        // gave a different total for each sampling rate.
        const sparse = growingDegreeDays([
            sample({ at: T0, airTemperature: 28 }),
            sample({ at: T0 + 3_600_000, airTemperature: 12 }),
        ]);
        const dense = growingDegreeDays(
            Array.from({ length: 25 }, (_, index) =>
                sample({
                    at: T0 + index * 600_000,
                    airTemperature: index === 0 ? 28 : index === 24 ? 12 : 20,
                })
            )
        );

        expect(dense.total).toBeCloseTo(sparse.total, 6);
    });
});

describe('dailyLightIntegral', () => {
    it('integrates a flat 500 µmol/m²·s over twelve hours to 21.6 mol/m²·day', () => {
        const samples = Array.from({ length: 13 }, (_, index) =>
            sample({ at: T0 + index * 3_600_000, par: index === 12 ? 0 : 500 })
        );

        const result = dailyLightIntegral(samples);

        expect(result.days).toHaveLength(1);
        expect(result.days[0]?.dli).toBeCloseTo(21.6, 6);
    });

    it('counts a night as zero light rather than as no data', () => {
        const samples = [
            sample({ at: T0, par: 0 }),
            sample({ at: T0 + 3_600_000, par: 0 }),
        ];

        expect(dailyLightIntegral(samples).days[0]?.dli).toBe(0);
    });

    it('is zero-mean on an empty window instead of NaN', () => {
        expect(dailyLightIntegral([]).mean).toBe(0);
    });

    it('does not extrapolate past the last reading', () => {
        // Two readings an hour apart: one interval, not two.
        const result = dailyLightIntegral([
            sample({ at: T0, par: 1000 }),
            sample({ at: T0 + 3_600_000, par: 1000 }),
        ]);

        expect(result.days[0]?.dli).toBeCloseTo(3.6, 6);
    });
});

describe('botrytisRisk', () => {
    it('is HIGH inside the infection window cloud/main.py defines', () => {
        // 15-25 °C and RH > 85.
        expect(botrytisRisk(20, 90).level).toBe('HIGH');
        expect(botrytisRisk(15, 86).level).toBe('HIGH');
        expect(botrytisRisk(25, 95).level).toBe('HIGH');
    });

    it('is not HIGH outside that window, however humid', () => {
        expect(botrytisRisk(30, 95).level).not.toBe('HIGH');
        expect(botrytisRisk(10, 99).level).not.toBe('HIGH');
    });

    it('does not rise with temperature above the optimum', () => {
        // The old model's score climbed indefinitely with temperature, so a
        // 35 °C afternoon read as the highest Botrytis risk of the day.
        expect(botrytisRisk(35, 70).index).toBeLessThan(botrytisRisk(20, 90).index);
    });

    it('flags condensation risk outside the temperature window', () => {
        // 30 °C at 90% RH is too warm for the classic window, but the dew
        // point is 28.2 °C — under two degrees of margin, so there will be
        // free water on the leaf as soon as the night cools.
        expect(botrytisRisk(30, 90).level).toBe('MEDIUM');
    });

    it('is LOW and says so when there are no readings', () => {
        expect(botrytisRisk(null, null)).toMatchObject({ level: 'LOW', index: 0 });
        expect(botrytisRisk(Number.NaN, 90).level).toBe('LOW');
    });
});
