import type { Alert, IndustryReading, Millis } from '@cognitex/data';

import { findMachine } from './machines';
import { isRunning } from './oee';
import type { Machine } from './types';

/**
 * Alarms derived from telemetry, in the shared `Alert` shape.
 *
 * The event log this replaces built `{time, priority}` objects while the REST
 * feed emitted `{timestamp, severity}` — the packages README calls that pair
 * out by name, because the ticker rendered a blank time and the critical
 * filter matched nothing. There is one shape now and the compiler holds it.
 *
 * Only used when the console is running on generated data. With Firestore
 * configured the alerts come from the collection the ingestion pipeline
 * writes, so two operators looking at the same plant see the same list.
 */

interface Rule {
    id: string;
    /** Reads the measurement this rule watches. */
    value: (reading: IndustryReading) => number;
    limit: (machine: Machine) => number;
    status: Alert['status'];
    describe: (value: number, machine: Machine) => string;
}

const RULES: readonly Rule[] = [
    {
        id: 'temp',
        value: (reading) => reading.temperature,
        limit: (machine) => machine.temperatureAlarm,
        status: 'alert',
        describe: (value, machine) =>
            `${machine.name}: sobrecalentamiento, ${value.toFixed(1)} °C (límite ${machine.temperatureAlarm} °C)`,
    },
    {
        id: 'vib',
        value: (reading) => reading.vibration,
        limit: (machine) => machine.vibrationAlarm,
        status: 'alert',
        describe: (value, machine) =>
            `${machine.name}: vibración ${value.toFixed(2)} mm/s en zona D (límite ${machine.vibrationAlarm} mm/s)`,
    },
    {
        id: 'power',
        value: (reading) => reading.power,
        limit: (machine) => machine.powerAlarm,
        status: 'warning',
        describe: (value, machine) =>
            `${machine.name}: sobrecarga eléctrica, ${Math.round(value)} W (límite ${machine.powerAlarm} W)`,
    },
];

/**
 * One alarm per rule per breach.
 *
 * Ids are deterministic — asset, instant and rule — so re-deriving the list
 * from the same readings does not produce a second copy of every alarm, and a
 * React key stays stable across a refresh.
 */
export function deriveAlerts(
    readings: readonly IndustryReading[],
    orgId: string,
    max = 40
): Alert[] {
    const alerts: Alert[] = [];

    for (const reading of readings) {
        const machine = findMachine(reading.assetId);
        if (!machine) continue;

        if (!isRunning(reading)) continue;

        for (const rule of RULES) {
            const value = rule.value(reading);
            if (value < rule.limit(machine)) continue;

            alerts.push({
                id: `${reading.assetId}-${reading.at}-${rule.id}`,
                orgId,
                assetId: reading.assetId,
                at: reading.at,
                status: rule.status,
                message: rule.describe(value, machine),
                acknowledgedAt: null,
            });
        }
    }

    return alerts.sort((a, b) => b.at - a.at).slice(0, max);
}

/** Unacknowledged alarms in the last `windowMs`, newest first. */
export function activeAlerts(
    alerts: readonly Alert[],
    options: { now: Millis; windowMs: number }
): Alert[] {
    const earliest = options.now - options.windowMs;
    return alerts
        .filter((alert) => alert.acknowledgedAt === null && alert.at >= earliest)
        .sort((a, b) => b.at - a.at);
}
