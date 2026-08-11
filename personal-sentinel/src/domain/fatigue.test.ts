import { describe, expect, it } from 'vitest';

import {
    dailyFatigue,
    dominantDriver,
    fatigueBand,
    heartRateReserve,
    maxHeartRate,
    scoreFatigue,
    thermalLoad,
} from './fatigue';
import { WORK_SHIFT, findWorker } from './workers';
import { at, hourly, reading } from './fixtures';

const welder = findWorker('WRK-001')!; // 46, resting 68 → max 174, reserve 106
const chemist = findWorker('WRK-004')!; // 31, resting 58 → max 189, reserve 131

describe('heartRateReserve', () => {
    it('measures against the worker own reserve, not a population number', () => {
        // The same 130 bpm is a different strain for these two people, which
        // one hardcoded `> 120` threshold could not express.
        expect(heartRateReserve(130, welder)).toBeCloseTo(58.49, 2);
        expect(heartRateReserve(130, chemist)).toBeCloseTo(54.96, 2);
    });

    it('is zero at rest and never negative below it', () => {
        expect(heartRateReserve(welder.restingHeartRate, welder)).toBe(0);
        expect(heartRateReserve(40, welder)).toBe(0);
    });

    it('caps at the age-predicted maximum', () => {
        expect(heartRateReserve(maxHeartRate(welder.age), welder)).toBe(100);
        expect(heartRateReserve(250, welder)).toBe(100);
    });
});

describe('thermalLoad', () => {
    it('is zero at the 37.5 °C baseline and full at the 38.5 °C limit', () => {
        expect(thermalLoad(37.5)).toBe(0);
        expect(thermalLoad(38)).toBeCloseTo(50, 6);
        expect(thermalLoad(38.5)).toBe(100);
    });

    it('does not go negative for a normal resting temperature', () => {
        expect(thermalLoad(36.6)).toBe(0);
    });
});

describe('fatigueBand', () => {
    it('maps the score onto the shared status vocabulary', () => {
        expect(fatigueBand(10)).toEqual({ band: 'baja', status: 'ok' });
        expect(fatigueBand(45)).toEqual({ band: 'moderada', status: 'warning' });
        expect(fatigueBand(70)).toEqual({ band: 'alta', status: 'alert' });
        expect(fatigueBand(95)).toEqual({ band: 'critica', status: 'alert' });
    });

    it('treats a score of exactly zero as the best band, not as missing', () => {
        expect(fatigueBand(0).band).toBe('baja');
    });
});

describe('scoreFatigue', () => {
    it('weights the four drivers as documented', () => {
        // Every driver at 50: reported 50, 50% of reserve, 38.0 °C, half the
        // nine-hour shift elapsed at 12:30.
        const result = scoreFatigue(
            reading({
                at: at(2026, 4, 6, 12, 30),
                fatigue: 50,
                heartRate: 121,
                bodyTemperature: 38,
            }),
            welder,
            WORK_SHIFT
        );

        expect(result.drivers.reported).toBe(50);
        expect(result.drivers.cardiac).toBeCloseTo(50, 1);
        expect(result.drivers.thermal).toBeCloseTo(50, 6);
        expect(result.drivers.duration).toBeCloseTo(50, 6);
        expect(result.score).toBeCloseTo(50, 1);
        expect(result.band).toBe('moderada');
    });

    it('scores a rested worker at the start of the shift as zero', () => {
        const result = scoreFatigue(
            reading({
                at: at(2026, 4, 6, 8),
                fatigue: 0,
                heartRate: welder.restingHeartRate,
                bodyTemperature: 36.6,
            }),
            welder,
            WORK_SHIFT
        );

        // A real zero. `value || '--'` would have rendered this as no data.
        expect(result.score).toBe(0);
        expect(result.status).toBe('ok');
    });

    it('contributes no shift time outside the shift', () => {
        const result = scoreFatigue(
            reading({ at: at(2026, 4, 6, 2), fatigue: 40 }),
            welder,
            WORK_SHIFT
        );

        expect(result.drivers.duration).toBe(0);
    });

    it('reaches the critical band when every driver is at its limit', () => {
        const result = scoreFatigue(
            reading({
                at: at(2026, 4, 6, 16, 45),
                fatigue: 100,
                heartRate: 200,
                bodyTemperature: 39.5,
            }),
            welder,
            WORK_SHIFT
        );

        expect(result.score).toBeGreaterThan(95);
        expect(result.band).toBe('critica');
        expect(result.status).toBe('alert');
    });
});

describe('dominantDriver', () => {
    it('names the driver carrying the most weighted contribution', () => {
        expect(
            dominantDriver({ reported: 50, cardiac: 50, thermal: 50, duration: 50 })
        ).toBe('reported');

        // Cardiac at 0.3 beats reported at 0.4 once it is far enough ahead.
        expect(
            dominantDriver({ reported: 20, cardiac: 95, thermal: 10, duration: 10 })
        ).toBe('cardiac');
    });
});

describe('dailyFatigue', () => {
    it('averages on-shift readings only, one point per day', () => {
        const readings = [
            // Three on-shift readings on 6 April.
            ...hourly(at(2026, 4, 6, 9), 3, () => ({ fatigue: 60, heartRate: 68 })),
            // Two overnight readings that would drag the mean toward zero.
            ...hourly(at(2026, 4, 6, 1), 2, () => ({ fatigue: 0, heartRate: 60 })),
            // One on-shift reading the next day.
            ...hourly(at(2026, 4, 7, 9), 1, () => ({ fatigue: 20, heartRate: 68 })),
        ];

        const series = dailyFatigue(readings, welder, WORK_SHIFT);

        expect(series).toHaveLength(2);
        expect(series[0]?.samples).toBe(3);
        expect(series[0]?.mean).toBeGreaterThan(series[1]!.mean);
    });

    it('reads only its own worker readings', () => {
        const readings = [
            ...hourly(at(2026, 4, 6, 9), 2),
            ...hourly(at(2026, 4, 6, 9), 4, () => ({ assetId: chemist.id })),
        ];

        expect(dailyFatigue(readings, welder, WORK_SHIFT)[0]?.samples).toBe(2);
    });

    it('is empty when the worker has no on-shift readings', () => {
        expect(dailyFatigue(hourly(at(2026, 4, 6, 2), 3), welder, WORK_SHIFT)).toEqual([]);
    });
});
