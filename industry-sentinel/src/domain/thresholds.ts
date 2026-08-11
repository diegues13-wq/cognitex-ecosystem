import type { IndustryReading } from '@cognitex/data';
import { STATUS_RANK, type Status } from '@cognitex/theme';

import { isRunning } from './oee';
import type { Machine } from './types';

/**
 * Turning numbers into the shared status vocabulary.
 *
 * One function, so "warning" means the same distance from target on every
 * card. The old console decided this inline at each call site with a different
 * literal each time, and used `isAlert={stats.temp > 80}` for a robot arm and
 * an injection moulder alike.
 */

/** Thresholds always read better-value-first, whichever way the metric runs. */
export function rank(
    value: number,
    good: number,
    warn: number,
    higherIsBetter = true
): Status {
    if (!Number.isFinite(value)) return 'offline';
    if (higherIsBetter) {
        if (value >= good) return 'ok';
        return value >= warn ? 'warning' : 'alert';
    }
    if (value <= good) return 'ok';
    return value <= warn ? 'warning' : 'alert';
}

/** The worst of several statuses. `offline` only wins when it is alone. */
export function worst(statuses: readonly Status[]): Status {
    if (statuses.length === 0) return 'offline';
    return statuses.reduce((left, right) =>
        STATUS_RANK[right] > STATUS_RANK[left] ? right : left
    );
}

/**
 * A machine's state from its most recent reading.
 *
 * Each limit is the machine's own, so an injection moulder at 210 °C is
 * normal and a robot arm at 210 °C is not — which the single hardcoded
 * `> 85` could not express.
 */
export function machineStatus(reading: IndustryReading, machine: Machine): Status {
    // A stopped machine inside a stopped line is not "0 °C bad"; it is idle.
    if (!isRunning(reading)) return 'offline';

    return worst([
        rank(reading.temperature, machine.temperatureAlarm * 0.85, machine.temperatureAlarm, false),
        rank(reading.vibration, machine.vibrationAlarm * 0.7, machine.vibrationAlarm, false),
        rank(reading.power, machine.powerAlarm * 0.9, machine.powerAlarm, false),
    ]);
}
