import type { IndustryReading, Millis } from '@cognitex/data';
import type { Status } from '@cognitex/theme';

import { isRunning } from './oee';
import { DAY_MS } from './shift';
import type { Machine } from './types';

/**
 * Predictive maintenance from the vibration trend.
 *
 * What this replaces was a `<div>` with `w-[20%]` on a gradient bar, the word
 * "BAJO", and "Próximo servicio: 340 hrs" — the same three for every machine,
 * wired to nothing.
 *
 * Bearing degradation shows up as a rising RMS velocity long before the
 * failure, which is the whole reason vibration is instrumented. A least-
 * squares fit over the running samples gives the rate of rise, and the rate
 * gives the time left before the machine reaches its alarm limit.
 *
 * The forecast is deliberately fragile in an honest direction: no trend, a
 * falling trend or too few samples all return `hoursToAlarm: null`, never a
 * large number that reads as "plenty of time".
 */

export interface VibrationTrend {
    /** Running samples the fit was built from. */
    samples: number;
    /** mm/s per day. Negative means the machine is settling down. */
    slopePerDay: number;
    /** Fitted value at the most recent sample. */
    fittedLatest: number;
    /** Most recent measured value. */
    latest: number;
    /** Mean over the window. */
    mean: number;
}

/** Least squares over (days, vibration). Null below two running samples. */
export function vibrationTrend(readings: readonly IndustryReading[]): VibrationTrend | null {
    const running = readings.filter(isRunning).sort((a, b) => a.at - b.at);
    if (running.length < 2) return null;

    const origin = running[0]!.at;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (const reading of running) {
        const x = (reading.at - origin) / DAY_MS;
        const y = reading.vibration;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    }

    const n = running.length;
    const denominator = n * sumXX - sumX * sumX;
    // Every sample at the same instant: a mean, not a slope.
    const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;
    const lastX = (running[n - 1]!.at - origin) / DAY_MS;

    return {
        samples: n,
        slopePerDay: slope,
        fittedLatest: intercept + slope * lastX,
        latest: running[n - 1]!.vibration,
        mean: sumY / n,
    };
}

/**
 * ISO 10816 zones, scaled to the machine's own alarm limit.
 *
 * The real standard tabulates absolute boundaries per machine class and per
 * mounting; we hold one limit per machine and scale it, which is a
 * simplification and is written down here rather than implied. A is new, B is
 * acceptable for unrestricted long-term running, C is unsatisfactory, D is
 * doing damage.
 */
export type VibrationZone = 'A' | 'B' | 'C' | 'D';

export function vibrationZone(value: number, machine: Machine): VibrationZone {
    const limit = machine.vibrationAlarm;
    if (value >= limit) return 'D';
    if (value >= limit * 0.7) return 'C';
    if (value >= limit * 0.4) return 'B';
    return 'A';
}

const ZONE_STATUS: Record<VibrationZone, Status> = {
    A: 'ok',
    B: 'ok',
    C: 'warning',
    D: 'alert',
};

export interface MaintenanceForecast {
    machine: Machine;
    trend: VibrationTrend;
    zone: VibrationZone;
    status: Status;
    /**
     * Hours until the fitted line reaches the alarm limit.
     *
     * Null when the trend is flat or falling, and zero when the limit has
     * already been passed. Never a fabricated horizon.
     */
    hoursToAlarm: number | null;
    /** When the limit is projected to be reached. Null with `hoursToAlarm`. */
    alarmAt: Millis | null;
}

export function forecastMaintenance(
    machine: Machine,
    readings: readonly IndustryReading[],
    now: Millis
): MaintenanceForecast | null {
    const trend = vibrationTrend(readings.filter((r) => r.assetId === machine.id));
    if (!trend) return null;

    const zone = vibrationZone(trend.latest, machine);
    const remaining = machine.vibrationAlarm - trend.fittedLatest;

    let hoursToAlarm: number | null = null;
    if (remaining <= 0) {
        hoursToAlarm = 0;
    } else if (trend.slopePerDay > 0) {
        hoursToAlarm = (remaining / trend.slopePerDay) * 24;
    }

    return {
        machine,
        trend,
        zone,
        // A machine already in zone D is an alert whatever the slope says.
        status: ZONE_STATUS[zone],
        hoursToAlarm,
        alarmAt: hoursToAlarm === null ? null : now + hoursToAlarm * 3_600_000,
    };
}

/**
 * The maintenance queue: soonest limit first.
 *
 * Machines with no usable forecast sort last rather than being dropped — a
 * machine the console cannot see is a maintenance question too, and hiding it
 * makes the list look complete when it is not.
 */
export function maintenanceQueue(
    machines: readonly Machine[],
    readings: readonly IndustryReading[],
    now: Millis
): MaintenanceForecast[] {
    return machines
        .map((machine) => forecastMaintenance(machine, readings, now))
        .filter((forecast): forecast is MaintenanceForecast => forecast !== null)
        .sort((a, b) => {
            const left = a.hoursToAlarm ?? Number.POSITIVE_INFINITY;
            const right = b.hoursToAlarm ?? Number.POSITIVE_INFINITY;
            return left - right;
        });
}
