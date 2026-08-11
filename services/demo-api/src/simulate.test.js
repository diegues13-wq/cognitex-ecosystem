import { describe, expect, it } from 'vitest';
import { simulateOfficeSeries, simulateVehicleDay } from './simulate.js';

describe('simulateOfficeSeries', () => {
    const now = Date.UTC(2026, 7, 10, 12, 0, 0);

    it('covers the requested window ending now', () => {
        const series = simulateOfficeSeries(24, now);

        expect(series.at(-1).at).toBe(now);
        expect(now - series[0].at).toBeCloseTo(24 * 60 * 60 * 1000, -3);
    });

    it('is ordered oldest first, so the chart can map it straight through', () => {
        const series = simulateOfficeSeries(24, now);
        const timestamps = series.map((p) => p.at);

        expect([...timestamps].sort((a, b) => a - b)).toEqual(timestamps);
    });

    it('never produces a negative or absurd load', () => {
        for (const point of simulateOfficeSeries(24, now)) {
            expect(point.kw).toBeGreaterThan(0);
            expect(point.kw).toBeLessThan(20);
        }
    });

    it('peaks during working hours, not overnight', () => {
        const series = simulateOfficeSeries(24, now);
        const peak = series.reduce((a, b) => (b.kw > a.kw ? b : a));
        const peakHour = new Date(peak.at).getHours();

        expect(peakHour).toBeGreaterThanOrEqual(8);
        expect(peakHour).toBeLessThanOrEqual(16);
    });
});

describe('simulateVehicleDay', () => {
    it('reports nothing before the day starts', () => {
        const early = simulateVehicleDay(new Date(2026, 7, 10, 5, 0).getTime());

        expect(early.kmToday).toBe(0);
        expect(early.stops).toBe(0);
    });

    it('accumulates distance through the day rather than jumping at midnight', () => {
        const morning = simulateVehicleDay(new Date(2026, 7, 10, 9, 0).getTime());
        const evening = simulateVehicleDay(new Date(2026, 7, 10, 17, 0).getTime());

        expect(evening.kmToday).toBeGreaterThan(morning.kmToday);
    });

    it('stops growing after the working day ends', () => {
        const evening = simulateVehicleDay(new Date(2026, 7, 10, 18, 0).getTime());
        const night = simulateVehicleDay(new Date(2026, 7, 10, 23, 0).getTime());

        expect(night.kmToday).toBe(evening.kmToday);
    });
});
