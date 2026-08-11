import type { IndustryReading } from '@cognitex/data';

import { isScheduled } from './shift';
import type { Machine, Shift } from './types';

/**
 * Overall Equipment Effectiveness, decomposed.
 *
 * OEE is availability × performance × quality. The value that matters to a
 * plant manager is the product; the value that tells them what to do is the
 * factor that dragged it down. The old console showed neither — it printed the
 * `battery` field of the most recent generated row and captioned it "OEE".
 *
 * Of the three factors this platform's telemetry can measure two:
 *
 *   availability   the share of scheduled time the machine was turning
 *   performance    mean speed against the machine's rated speed
 *
 * Quality needs a scrap count, which no sensor in `IndustryReading` carries.
 * Rather than invent one, `impliedQuality` back-computes it from the OEE the
 * MES reports — and returns null when it cannot, instead of a plausible zero.
 * A value above 100 is not a bug in this function: it means the reported OEE
 * cannot be reconciled with the telemetry, which is worth seeing.
 *
 * Every figure is 0-100, the same scale as `IndustryReading.oee`, so nothing
 * downstream has to remember which of them is a fraction.
 */

export interface OeeBreakdown {
    /** Readings inside scheduled time. The denominator of availability. */
    scheduledSamples: number;
    /** Scheduled readings where the machine was turning. */
    runningSamples: number;
    /**
     * 0-100. Zero when nothing ran *and* when nothing was scheduled — check
     * `scheduledSamples` first, because "the plant was closed" and "the line
     * never started" are different facts.
     */
    availability: number;
    /** 0-100. Null when the machine never ran, so there is nothing to rate. */
    performance: number | null;
    /** 0-100, the MES figure averaged over scheduled time. Null when idle. */
    reportedOee: number | null;
    /** 0-100. Null when availability or performance is zero. */
    impliedQuality: number | null;
}

const EMPTY: OeeBreakdown = {
    scheduledSamples: 0,
    runningSamples: 0,
    availability: 0,
    performance: null,
    reportedOee: null,
    impliedQuality: null,
};

/** A machine is running when the spindle, belt or arm is actually turning. */
export function isRunning(reading: IndustryReading): boolean {
    return reading.speed > 0;
}

export function computeOee(
    readings: readonly IndustryReading[],
    machine: Machine,
    shift: Shift
): OeeBreakdown {
    let scheduledSamples = 0;
    let runningSamples = 0;
    let speedSum = 0;
    let oeeSum = 0;

    for (const reading of readings) {
        if (!isScheduled(reading.at, shift)) continue;

        scheduledSamples += 1;
        // A stopped machine contributes its zero to the reported OEE: that is
        // exactly the availability loss the figure is supposed to carry.
        oeeSum += reading.oee;

        if (isRunning(reading)) {
            runningSamples += 1;
            speedSum += reading.speed;
        }
    }

    if (scheduledSamples === 0) return EMPTY;

    const availability = (runningSamples / scheduledSamples) * 100;
    const performance =
        runningSamples === 0 || machine.ratedSpeed <= 0
            ? null
            : (speedSum / runningSamples / machine.ratedSpeed) * 100;
    const reportedOee = oeeSum / scheduledSamples;

    const factor = (availability / 100) * ((performance ?? 0) / 100);

    return {
        scheduledSamples,
        runningSamples,
        availability,
        performance,
        reportedOee,
        impliedQuality: factor > 0 ? reportedOee / factor : null,
    };
}

/**
 * OEE across the whole plant.
 *
 * Sample-weighted, not a mean of means: a machine with twice the readings has
 * twice the weight, which is what you want when one line is sampled faster
 * than another. Machines with no scheduled readings contribute nothing rather
 * than dragging the plant figure toward zero.
 */
export function plantOee(
    readings: readonly IndustryReading[],
    machines: readonly Machine[],
    shift: Shift
): OeeBreakdown {
    let scheduledSamples = 0;
    let runningSamples = 0;
    let weightedPerformance = 0;
    let performanceWeight = 0;
    let oeeSum = 0;

    for (const machine of machines) {
        const own = readings.filter((reading) => reading.assetId === machine.id);
        const result = computeOee(own, machine, shift);
        if (result.scheduledSamples === 0) continue;

        scheduledSamples += result.scheduledSamples;
        runningSamples += result.runningSamples;
        oeeSum += (result.reportedOee ?? 0) * result.scheduledSamples;

        if (result.performance !== null) {
            weightedPerformance += result.performance * result.runningSamples;
            performanceWeight += result.runningSamples;
        }
    }

    if (scheduledSamples === 0) return EMPTY;

    const availability = (runningSamples / scheduledSamples) * 100;
    const performance = performanceWeight === 0 ? null : weightedPerformance / performanceWeight;
    const reportedOee = oeeSum / scheduledSamples;
    const factor = (availability / 100) * ((performance ?? 0) / 100);

    return {
        scheduledSamples,
        runningSamples,
        availability,
        performance,
        reportedOee,
        impliedQuality: factor > 0 ? reportedOee / factor : null,
    };
}

/**
 * Whether the reported OEE can be reconciled with what the sensors saw.
 *
 * `inconsistente` means the MES is claiming more output than the availability
 * and speed on the wire can account for — a data-quality finding, and the sort
 * of thing that silently inflates a monthly report for a year.
 */
export type OeeConsistency = 'ok' | 'inconsistente' | 'desconocida';

export function oeeConsistency(breakdown: OeeBreakdown): OeeConsistency {
    if (breakdown.impliedQuality === null) return 'desconocida';
    // A percent of tolerance for rounding in the MES feed.
    return breakdown.impliedQuality > 101 ? 'inconsistente' : 'ok';
}
