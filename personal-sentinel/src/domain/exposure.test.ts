import { describe, expect, it } from 'vitest';

import {
    crewExposure,
    exposureBudget,
    exposureThreshold,
    exposureWindows,
    recentWindows,
} from './exposure';
import { HOUR_MS } from './shift';
import { WORKERS, findWorker } from './workers';
import { at, hourly, reading } from './fixtures';

const welder = findWorker('WRK-001')!; // 46 → max 174, 85% = 147.9
const chemist = findWorker('WRK-004')!; // 31 → max 189, 85% = 160.65

describe('exposureThreshold', () => {
    it('is a fixed deep-body limit for heat', () => {
        expect(exposureThreshold('termica', welder)).toBe(38.5);
        expect(exposureThreshold('termica', chemist)).toBe(38.5);
    });

    it('is per worker for cardiac strain', () => {
        expect(exposureThreshold('cardiaca', welder)).toBeCloseTo(147.9, 6);
        expect(exposureThreshold('cardiaca', chemist)).toBeCloseTo(160.65, 6);
    });
});

describe('exposureWindows', () => {
    it('does not turn a single spike into an exposure window of its own length', () => {
        const readings = hourly(at(2026, 4, 6, 8), 5, (index) =>
            index === 2 ? { bodyTemperature: 39 } : {}
        );

        const [window] = exposureWindows(readings, 'termica', welder);

        // One sample over the limit, closed by the next sample under it.
        expect(window?.from).toBe(at(2026, 4, 6, 10));
        expect(window?.to).toBe(at(2026, 4, 6, 11));
        expect(window?.durationMs).toBe(HOUR_MS);
        expect(window?.peak).toBe(39);
    });

    it('merges a sustained stretch into one window and keeps the peak', () => {
        const readings = hourly(at(2026, 4, 6, 8), 8, (index) =>
            index >= 2 && index <= 4 ? { bodyTemperature: 38.6 + index * 0.1 } : {}
        );

        const windows = exposureWindows(readings, 'termica', welder);

        expect(windows).toHaveLength(1);
        expect(windows[0]?.durationMs).toBe(3 * HOUR_MS);
        expect(windows[0]?.peak).toBeCloseTo(39, 6);
    });

    it('finds a cardiac window for one worker that is not one for another', () => {
        // 155 bpm is over the welder's 147.9 limit and under the chemist's.
        const readings = hourly(at(2026, 4, 6, 8), 4, (index) =>
            index === 1 ? { heartRate: 155 } : {}
        );

        expect(exposureWindows(readings, 'cardiaca', welder)).toHaveLength(1);
        expect(
            exposureWindows(
                readings.map((entry) => ({ ...entry, assetId: chemist.id })),
                'cardiaca',
                chemist
            )
        ).toHaveLength(0);
    });

    it('marks a window still open at the end of the feed as unresolved', () => {
        const readings = hourly(at(2026, 4, 6, 8), 4, (index) =>
            index >= 2 ? { bodyTemperature: 39 } : {}
        );

        const [window] = exposureWindows(readings, 'termica', welder);

        expect(window?.resolved).toBe(false);
        expect(window?.durationMs).toBe(HOUR_MS);
    });

    it('reads only its own worker readings', () => {
        const readings = [
            ...hourly(at(2026, 4, 6, 8), 3, () => ({ bodyTemperature: 39 })),
            ...hourly(at(2026, 4, 6, 8), 3, () => ({
                assetId: chemist.id,
                bodyTemperature: 39,
            })),
        ];

        expect(exposureWindows(readings, 'termica', welder)[0]?.assetId).toBe(welder.id);
        expect(exposureWindows(readings, 'termica', welder)).toHaveLength(1);
    });

    it('is empty for a shift spent under the limit', () => {
        expect(exposureWindows(hourly(at(2026, 4, 6, 8), 9), 'termica', welder)).toEqual([]);
    });
});

describe('exposureBudget', () => {
    it('reports zero exposure as the best possible reading', () => {
        const budget = exposureBudget([], 'termica');

        expect(budget.windows).toBe(0);
        expect(budget.totalMs).toBe(0);
        expect(budget.used).toBe(0);
        expect(budget.status).toBe('ok');
    });

    it('reports past the daily allowance rather than clamping at full', () => {
        // Two hours over the limit against a fifteen-minute thermal allowance.
        const readings = hourly(at(2026, 4, 6, 8), 5, (index) =>
            index >= 1 && index <= 2 ? { bodyTemperature: 39 } : {}
        );

        const budget = exposureBudget(exposureWindows(readings, 'termica', welder), 'termica');

        expect(budget.totalMs).toBe(2 * HOUR_MS);
        expect(budget.used).toBeCloseTo(800, 6);
        expect(budget.status).toBe('alert');
    });

    it('keeps the longest single window alongside the total', () => {
        const readings = hourly(at(2026, 4, 6, 8), 10, (index) =>
            index === 1 || (index >= 4 && index <= 6) ? { heartRate: 160 } : {}
        );

        const budget = exposureBudget(exposureWindows(readings, 'cardiaca', welder), 'cardiaca');

        expect(budget.windows).toBe(2);
        expect(budget.totalMs).toBe(4 * HOUR_MS);
        expect(budget.longestMs).toBe(3 * HOUR_MS);
    });
});

describe('recentWindows', () => {
    const now = at(2026, 4, 8, 12);

    it('keeps only windows that started inside the period, newest first', () => {
        const readings = [
            reading({ at: now - 2 * HOUR_MS, bodyTemperature: 39 }),
            reading({ at: now - HOUR_MS }),
            reading({ at: now - 50 * HOUR_MS, bodyTemperature: 39 }),
            reading({ at: now - 49 * HOUR_MS }),
        ];

        const recent = recentWindows(exposureWindows(readings, 'termica', welder), {
            now,
            windowMs: 24 * HOUR_MS,
        });

        expect(recent).toHaveLength(1);
        expect(recent[0]?.from).toBe(now - 2 * HOUR_MS);
    });
});

describe('crewExposure', () => {
    const now = at(2026, 4, 6, 18);

    it('answers for every worker, including the ones with nothing to report', () => {
        const readings = hourly(at(2026, 4, 6, 8), 4, (index) =>
            index === 1 ? { bodyTemperature: 39 } : {}
        );

        const crew = crewExposure(readings, WORKERS, 'termica', now);

        expect(crew).toHaveLength(WORKERS.length);
        expect(crew.find((row) => row.worker.id === welder.id)?.budget.windows).toBe(1);
        // A worker with no readings gets a real zero, not a gap in the table.
        expect(crew.find((row) => row.worker.id === chemist.id)?.budget.windows).toBe(0);
    });
});
