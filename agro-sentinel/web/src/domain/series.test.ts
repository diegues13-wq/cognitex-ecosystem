import { describe, expect, it } from 'vitest';

import { downsample, latestSample, statsFor, toSeries, trendOf } from './series';
import { T0, at, sample, series } from './fixtures';

describe('toSeries', () => {
    it('returns oldest first, whatever order the store answered in', () => {
        const points = toSeries(
            [
                sample({ at: at(5), airTemperature: 25 }),
                sample({ at: at(1), airTemperature: 21 }),
            ],
            'airTemperature'
        );

        expect(points.map((point) => point.value)).toEqual([21, 25]);
    });

    it('drops a gap rather than plotting it as zero', () => {
        const points = toSeries(
            series([{ batteryPct: 80 }, { batteryPct: null }, { batteryPct: 78 }]),
            'batteryPct'
        );

        expect(points).toHaveLength(2);
        expect(points.map((point) => point.value)).toEqual([80, 78]);
    });

    it('keeps a legitimate zero', () => {
        // PAR is 0 all night. That is a measurement, not a gap.
        expect(toSeries(series([{ par: 0 }]), 'par')).toEqual([{ at: T0, value: 0 }]);
    });
});

describe('statsFor', () => {
    const window = series([
        { airTemperature: 18 },
        { airTemperature: 26 },
        { airTemperature: 22 },
    ]);

    it('reports the extremes with the instants they happened at', () => {
        const stats = statsFor(window, 'airTemperature')!;

        expect(stats).toMatchObject({ count: 3, min: 18, max: 26, minAt: at(0), maxAt: at(1) });
        expect(stats.mean).toBeCloseTo(22, 6);
    });

    it('takes the latest by time, not by array position', () => {
        const shuffled = [
            sample({ at: at(9), airTemperature: 30 }),
            sample({ at: at(2), airTemperature: 15 }),
        ];

        expect(statsFor(shuffled, 'airTemperature')?.latest).toBe(30);
    });

    it('is null when the channel was never measured', () => {
        expect(statsFor(series([{ batteryPct: null }]), 'batteryPct')).toBeNull();
    });

    it('is null on an empty window, not a zeroed one', () => {
        expect(statsFor([], 'vpd')).toBeNull();
    });
});

describe('latestSample', () => {
    it('finds the newest regardless of input order', () => {
        const newest = latestSample([
            sample({ at: at(3) }),
            sample({ at: at(11) }),
            sample({ at: at(7) }),
        ]);

        expect(newest?.at).toBe(at(11));
    });

    it('is null when there is nothing', () => {
        expect(latestSample([])).toBeNull();
    });
});

describe('downsample', () => {
    it('leaves a short series alone', () => {
        const points = toSeries(series([{ vpd: 0.5 }, { vpd: 0.6 }]), 'vpd');

        expect(downsample(points, 100)).toEqual(points);
    });

    it('averages buckets instead of dropping points', () => {
        const points = Array.from({ length: 100 }, (_, index) => ({ at: at(index), value: index }));
        const thinned = downsample(points, 10);

        expect(thinned).toHaveLength(10);
        // First bucket is 0-9, mean 4.5.
        expect(thinned[0]?.value).toBeCloseTo(4.5, 6);
        expect(thinned.at(-1)?.value).toBeCloseTo(94.5, 6);
    });

    it('keeps a spike visible instead of stepping over it', () => {
        const points = Array.from({ length: 100 }, (_, index) => ({
            at: at(index),
            value: index === 51 ? 1000 : 0,
        }));

        expect(Math.max(...downsample(points, 10).map((point) => point.value))).toBeGreaterThan(0);
    });
});

describe('trendOf', () => {
    it('is the change between the two halves of the window', () => {
        const rising = series([
            { co2: 400 },
            { co2: 400 },
            { co2: 600 },
            { co2: 600 },
        ]);

        expect(trendOf(rising, 'co2')).toBeCloseTo(0.5, 6);
    });

    it('is null when there is too little to compare', () => {
        expect(trendOf(series([{ co2: 400 }, { co2: 500 }]), 'co2')).toBeNull();
    });

    it('is null rather than infinite when the earlier half is zero', () => {
        expect(trendOf(series([{ par: 0 }, { par: 0 }, { par: 900 }, { par: 900 }]), 'par')).toBeNull();
    });
});
