import type { Millis, PersonalReading } from '@cognitex/data';
import type { Status } from '@cognitex/theme';

import { hoursOnShift, shiftHours, startOfDay } from './shift';
import type { Shift, Worker } from './types';

/**
 * Fatigue, scored from four things the wearable can actually see.
 *
 * The card this replaces printed the `humidity` field of the most recent
 * generated row, called it "Índice Cognitivo", and turned red above 90 — one
 * threshold for every worker, and a number nothing computed.
 *
 * A composite is used because no single signal carries fatigue on its own: a
 * high heart rate during a lift is not fatigue, and a self-reported index on
 * its own is a guess. Each driver is normalised to 0-100 so the weights mean
 * what they look like, and the drivers are returned alongside the score so a
 * supervisor can see *why* someone scored 78 rather than being told they did.
 */

export interface FatigueDrivers {
    /** The wearable's own index, 0-100. */
    reported: number;
    /** Heart-rate reserve in use, Karvonen, 0-100. */
    cardiac: number;
    /** Deep-body temperature between 37.5 °C and the 38.5 °C limit, 0-100. */
    thermal: number;
    /** Hours on shift against the scheduled length, 0-100. */
    duration: number;
}

export type FatigueBand = 'baja' | 'moderada' | 'alta' | 'critica';

export interface FatigueScore {
    /** 0-100, higher is more fatigued. */
    score: number;
    band: FatigueBand;
    status: Status;
    drivers: FatigueDrivers;
}

/**
 * The weights.
 *
 * The wearable's own index carries the most because it is the only driver
 * measured *as* fatigue; the rest are physiological correlates. Time on shift
 * carries the least because it is the one thing a supervisor already knows.
 */
const WEIGHTS: Record<keyof FatigueDrivers, number> = {
    reported: 0.4,
    cardiac: 0.3,
    thermal: 0.2,
    duration: 0.1,
};

/** Deep-body temperature at which work must stop (ACGIH, unacclimatised). */
export const BODY_TEMPERATURE_LIMIT = 38.5;
const BODY_TEMPERATURE_BASE = 37.5;

/** Age-predicted maximum heart rate. The textbook 220 − age. */
export function maxHeartRate(age: number): number {
    return 220 - age;
}

/**
 * Percentage of heart-rate reserve in use — Karvonen.
 *
 * `(hr − resting) / (max − resting)`. This is the reason the worker registry
 * carries an age and a resting rate: 130 bpm is 62% of reserve for a 31-year
 * old with a resting rate of 58, and 84% for a 52-year old resting at 71. One
 * fixed 120 bpm threshold cannot say that.
 */
export function heartRateReserve(heartRate: number, worker: Worker): number {
    const span = maxHeartRate(worker.age) - worker.restingHeartRate;
    if (span <= 0) return 0;
    return clamp(((heartRate - worker.restingHeartRate) / span) * 100);
}

export function thermalLoad(bodyTemperature: number): number {
    const span = BODY_TEMPERATURE_LIMIT - BODY_TEMPERATURE_BASE;
    return clamp(((bodyTemperature - BODY_TEMPERATURE_BASE) / span) * 100);
}

const BANDS: readonly [number, FatigueBand, Status][] = [
    [30, 'baja', 'ok'],
    [60, 'moderada', 'warning'],
    [80, 'alta', 'alert'],
];

export function fatigueBand(score: number): { band: FatigueBand; status: Status } {
    for (const [limit, band, status] of BANDS) {
        if (score < limit) return { band, status };
    }
    return { band: 'critica', status: 'alert' };
}

export function scoreFatigue(
    reading: PersonalReading,
    worker: Worker,
    shift: Shift
): FatigueScore {
    const scheduled = shiftHours(shift);

    const drivers: FatigueDrivers = {
        reported: clamp(reading.fatigue),
        cardiac: heartRateReserve(reading.heartRate, worker),
        thermal: thermalLoad(reading.bodyTemperature),
        duration:
            scheduled === 0 ? 0 : clamp((hoursOnShift(reading.at, shift) / scheduled) * 100),
    };

    const score =
        drivers.reported * WEIGHTS.reported +
        drivers.cardiac * WEIGHTS.cardiac +
        drivers.thermal * WEIGHTS.thermal +
        drivers.duration * WEIGHTS.duration;

    return { score, ...fatigueBand(score), drivers };
}

/** The driver contributing most to a score, for the "why" column. */
export function dominantDriver(drivers: FatigueDrivers): keyof FatigueDrivers {
    const entries = Object.entries(drivers) as [keyof FatigueDrivers, number][];
    return entries.reduce((left, right) =>
        right[1] * WEIGHTS[right[0]] > left[1] * WEIGHTS[left[0]] ? right : left
    )[0];
}

export const DRIVER_LABEL: Record<keyof FatigueDrivers, string> = {
    reported: 'Índice del wearable',
    cardiac: 'Carga cardíaca',
    thermal: 'Carga térmica',
    duration: 'Horas en turno',
};

export interface DailyFatigue {
    day: Millis;
    /** Mean score across the day's on-shift readings. */
    mean: number;
    peak: number;
    samples: number;
}

/**
 * Mean fatigue per day, on-shift readings only, oldest first.
 *
 * Off-shift samples are excluded rather than averaged in: a resting worker at
 * 03:00 scores near zero, and including those hours drags every day's mean
 * toward "everyone is fine".
 */
export function dailyFatigue(
    readings: readonly PersonalReading[],
    worker: Worker,
    shift: Shift
): DailyFatigue[] {
    const byDay = new Map<Millis, { sum: number; peak: number; count: number }>();

    for (const reading of readings) {
        if (reading.assetId !== worker.id) continue;
        if (hoursOnShift(reading.at, shift) === 0) continue;

        const { score } = scoreFatigue(reading, worker, shift);
        const day = startOfDay(reading.at);
        const bucket = byDay.get(day) ?? { sum: 0, peak: 0, count: 0 };

        bucket.sum += score;
        bucket.peak = Math.max(bucket.peak, score);
        bucket.count += 1;
        byDay.set(day, bucket);
    }

    return [...byDay.entries()]
        .sort(([a], [b]) => a - b)
        .map(([day, bucket]) => ({
            day,
            mean: bucket.sum / bucket.count,
            peak: bucket.peak,
            samples: bucket.count,
        }));
}

function clamp(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.min(100, Math.max(0, value));
}
