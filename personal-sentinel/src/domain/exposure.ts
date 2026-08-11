import type { Millis, PersonalReading } from '@cognitex/data';
import type { Status } from '@cognitex/theme';

import { BODY_TEMPERATURE_LIMIT, maxHeartRate } from './fatigue';
import { HOUR_MS } from './shift';
import { rank } from './thresholds';
import type { ExposureWindow, Worker } from './types';

/**
 * How long someone spent over a physiological limit, and how often.
 *
 * A peak is not an exposure. A welder's heart rate touching 90% of maximum for
 * one sample during a lift is normal work; holding it there for twenty minutes
 * is a cardiac-strain finding, and the difference is the whole reason this
 * file exists. The old console had neither: it listed instantaneous readings
 * over a fixed number and called them events.
 *
 * A window opens at the first sample over the limit and closes at the first
 * sample back under it — the same convention the downtime scanner uses in
 * industry-sentinel, so a duration means the same thing in both consoles.
 */

export type ExposureKind = 'termica' | 'cardiaca';

export interface ExposureLimit {
    kind: ExposureKind;
    label: string;
    unit: string;
    precision: number;
    /**
     * Minutes above the limit allowed in a working day before the exposure is
     * itself the finding.
     */
    dailyBudgetMs: number;
}

export const EXPOSURE_LIMITS: Record<ExposureKind, ExposureLimit> = {
    termica: {
        kind: 'termica',
        label: 'Carga térmica',
        unit: '°C',
        precision: 1,
        // ACGIH treats a deep-body temperature over 38.5 °C as a stop-work
        // condition, so the daily allowance is deliberately small.
        dailyBudgetMs: 15 * 60_000,
    },
    cardiaca: {
        kind: 'cardiaca',
        label: 'Carga cardíaca',
        unit: 'bpm',
        precision: 0,
        // Sustained work above 85% of maximum heart rate; an hour a day is the
        // conventional ceiling for heavy continuous work.
        dailyBudgetMs: 60 * 60_000,
    },
};

/** The limit for a worker, which for cardiac strain is worker-specific. */
export function exposureThreshold(kind: ExposureKind, worker: Worker): number {
    return kind === 'termica'
        ? BODY_TEMPERATURE_LIMIT
        : maxHeartRate(worker.age) * 0.85;
}

function measurement(kind: ExposureKind, reading: PersonalReading): number {
    return kind === 'termica' ? reading.bodyTemperature : reading.heartRate;
}

export function exposureWindows(
    readings: readonly PersonalReading[],
    kind: ExposureKind,
    worker: Worker
): ExposureWindow[] {
    const threshold = exposureThreshold(kind, worker);
    const own = readings
        .filter((reading) => reading.assetId === worker.id)
        .sort((a, b) => a.at - b.at);

    const windows: ExposureWindow[] = [];
    let openedAt: Millis | null = null;
    let peak = 0;
    let lastAt: Millis | null = null;

    for (const reading of own) {
        const value = measurement(kind, reading);

        if (value >= threshold) {
            if (openedAt === null) {
                openedAt = reading.at;
                peak = value;
            } else {
                peak = Math.max(peak, value);
            }
        } else if (openedAt !== null) {
            windows.push(close(worker.id, openedAt, reading.at, peak, true));
            openedAt = null;
        }

        lastAt = reading.at;
    }

    if (openedAt !== null && lastAt !== null) {
        windows.push(close(worker.id, openedAt, lastAt, peak, false));
    }

    return windows;
}

function close(
    assetId: string,
    from: Millis,
    to: Millis,
    peak: number,
    resolved: boolean
): ExposureWindow {
    return { assetId, from, to, durationMs: Math.max(0, to - from), peak, resolved };
}

export interface ExposureBudget {
    kind: ExposureKind;
    windows: number;
    totalMs: number;
    budgetMs: number;
    /** 0-100 of the daily allowance consumed. Can exceed 100. */
    used: number;
    /** Longest single window. Zero when there were none. */
    longestMs: number;
    status: Status;
}

/**
 * The day's exposure against its allowance.
 *
 * `used` is allowed past 100 rather than clamped: "120% of the daily limit" is
 * the sentence a safety officer needs, and a bar pinned at full tells them
 * nothing about how far past it went.
 */
export function exposureBudget(
    windows: readonly ExposureWindow[],
    kind: ExposureKind
): ExposureBudget {
    const limit = EXPOSURE_LIMITS[kind];
    const totalMs = windows.reduce((sum, window) => sum + window.durationMs, 0);
    const longestMs = windows.reduce((longest, window) =>
        window.durationMs > longest ? window.durationMs : longest, 0);
    const used = limit.dailyBudgetMs === 0 ? 0 : (totalMs / limit.dailyBudgetMs) * 100;

    return {
        kind,
        windows: windows.length,
        totalMs,
        budgetMs: limit.dailyBudgetMs,
        used,
        longestMs,
        // Zero exposure is the best possible reading, and it ranks as such.
        status: rank(used, 50, 100, false),
    };
}

/** Windows that started within the last `windowMs`. */
export function recentWindows(
    windows: readonly ExposureWindow[],
    options: { now: Millis; windowMs: number }
): ExposureWindow[] {
    const earliest = options.now - options.windowMs;
    return windows.filter((window) => window.from >= earliest).sort((a, b) => b.from - a.from);
}

/** The exposure budget over the last 24 hours, for every worker. */
export function crewExposure(
    readings: readonly PersonalReading[],
    workers: readonly Worker[],
    kind: ExposureKind,
    now: Millis
): { worker: Worker; budget: ExposureBudget }[] {
    return workers.map((worker) => ({
        worker,
        budget: exposureBudget(
            recentWindows(exposureWindows(readings, kind, worker), {
                now,
                windowMs: 24 * HOUR_MS,
            }),
            kind
        ),
    }));
}
