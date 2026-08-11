import type { Millis, PersonalReading } from '@cognitex/data';
import type { Status } from '@cognitex/theme';

import { rank } from './thresholds';
import { INSTRUMENTED_PPE } from './workers';
import type { PpeItem, Worker } from './types';

/**
 * PPE, and how much of it the platform can honestly claim to have checked.
 *
 * The sidebar this replaces read "Casco Smart · CONECTADO" and "Chaleco · BATT
 * 85%" as literal strings in the markup, for every worker, always. Two green
 * badges asserting a measurement nobody had taken.
 *
 * Only the smart helmet reports. So exactly one item on each worker's list can
 * be verified, and the rest are marked `declarado` — which is the same promise
 * `DataSourceBadge` makes about the numbers: we sell measurement, so we say
 * when we are not measuring.
 */

export type PpeVerification = 'wearable' | 'declarado';

export interface PpeStatus {
    item: PpeItem;
    verification: PpeVerification;
    /** Null when the platform has no way to know. Not `false`. */
    compliant: boolean | null;
    note: string;
}

export interface WearableCoverage {
    worker: Worker;
    /** Most recent reading from this worker's helmet. Null when never seen. */
    lastSeen: Millis | null;
    /** No reading inside the staleness window: the helmet is not reporting. */
    stale: boolean;
    /** 0-100. Null when the worker has never reported. */
    battery: number | null;
    status: Status;
}

/**
 * How long a helmet may stay silent before it counts as offline.
 *
 * Two hours: long enough to survive a gateway hiccup or a tunnel, short enough
 * that a helmet left in a locker does not read as a worker on site.
 */
export const STALE_AFTER_MS = 2 * 60 * 60 * 1000;

export function wearableCoverage(
    readings: readonly PersonalReading[],
    worker: Worker,
    now: Millis,
    staleAfterMs = STALE_AFTER_MS
): WearableCoverage {
    let latest: PersonalReading | null = null;
    for (const reading of readings) {
        if (reading.assetId !== worker.id) continue;
        if (!latest || reading.at > latest.at) latest = reading;
    }

    if (!latest) {
        return { worker, lastSeen: null, stale: true, battery: null, status: 'offline' };
    }

    const stale = now - latest.at > staleAfterMs;

    return {
        worker,
        lastSeen: latest.at,
        stale,
        battery: latest.wearableBattery,
        // A stale helmet is offline whatever its last battery reading said —
        // a fall it cannot report is a fall nobody hears about.
        status: stale ? 'offline' : rank(latest.wearableBattery, 30, 10),
    };
}

export function ppeStatuses(worker: Worker, coverage: WearableCoverage): PpeStatus[] {
    return worker.requiredPpe.map((item) => {
        if (!INSTRUMENTED_PPE.includes(item)) {
            return {
                item,
                verification: 'declarado' as const,
                compliant: null,
                note: 'Sin sensor: declarado en el ingreso',
            };
        }

        if (coverage.lastSeen === null) {
            return {
                item,
                verification: 'wearable' as const,
                compliant: null,
                note: 'El casco nunca ha reportado',
            };
        }

        return {
            item,
            verification: 'wearable' as const,
            compliant: !coverage.stale,
            note: coverage.stale
                ? 'El casco lleva más de dos horas sin reportar'
                : 'Casco reportando',
        };
    });
}

export interface PpeCompliance {
    /** Items the platform can check at all. */
    verifiable: number;
    /** Items required, verifiable or not. */
    required: number;
    compliant: number;
    /** 0-100 over the verifiable items. Null when none can be verified. */
    rate: number | null;
}

export function ppeCompliance(statuses: readonly PpeStatus[]): PpeCompliance {
    const verifiable = statuses.filter((status) => status.compliant !== null);
    const compliant = verifiable.filter((status) => status.compliant === true).length;

    return {
        verifiable: verifiable.length,
        required: statuses.length,
        compliant,
        // Null, not 100: "nothing failed" and "nothing was checked" are not
        // the same claim, and only one of them belongs in a compliance report.
        rate: verifiable.length === 0 ? null : (compliant / verifiable.length) * 100,
    };
}

/** Coverage across the crew, for the summary card. */
export function crewCoverage(
    readings: readonly PersonalReading[],
    workers: readonly Worker[],
    now: Millis
): { covered: number; total: number; rate: number } {
    const covered = workers.filter(
        (worker) => !wearableCoverage(readings, worker, now).stale
    ).length;

    return {
        covered,
        total: workers.length,
        rate: workers.length === 0 ? 0 : (covered / workers.length) * 100,
    };
}
