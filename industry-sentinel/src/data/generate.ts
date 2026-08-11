import type { IndustryReading, Millis } from '@cognitex/data';

import { MACHINES, PRODUCTION_SHIFT, isScheduled } from '../domain';
import type { Machine } from '../domain';

/**
 * The demonstration plant.
 *
 * Only reached when Firebase is not configured, and everything it produces is
 * labelled `Datos simulados` on screen.
 *
 * Two things changed from the generator this replaces. It emits
 * `IndustryReading`, so vibration is `vibration` rather than `vpd`, power is
 * `power` rather than `co2` and OEE is `oee` rather than `battery`. And it is
 * deterministic: the original called `Math.random()` for every sample, so two
 * operators looking at the same demo saw different plants, and a screenshot
 * could not be reproduced.
 */

/** Numerical Recipes' LCG — small, fast, identical across engines. */
function seeded(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 0x1_0000_0000;
    };
}

/** Where each machine's physics sits when it is healthy and running. */
interface Baseline {
    temperature: number;
    vibration: number;
    power: number;
    /** Fraction of rated speed the line normally holds. */
    speedFactor: number;
    /** mm/s per day of bearing degradation, so the forecast has something to see. */
    wearPerDay: number;
}

const BASELINES: Record<string, Baseline> = {
    'MACH-01': { temperature: 58, vibration: 2.4, power: 4200, speedFactor: 0.94, wearPerDay: 0.02 },
    'MACH-02': { temperature: 68, vibration: 4.1, power: 5400, speedFactor: 0.9, wearPerDay: 0.05 },
    'ROBO-01': { temperature: 42, vibration: 0.6, power: 2100, speedFactor: 0.97, wearPerDay: 0.012 },
    'CONV-01': { temperature: 46, vibration: 1.3, power: 1700, speedFactor: 0.92, wearPerDay: 0.004 },
    'INJ-01': { temperature: 212, vibration: 1.8, power: 6400, speedFactor: 0.88, wearPerDay: 0.008 },
};

const IDLE: Baseline = {
    temperature: 22,
    vibration: 0.05,
    power: 120,
    speedFactor: 0,
    wearPerDay: 0,
};

export interface GenerateOptions {
    orgId: string;
    days: number;
    /** Samples per day. The console reads this back as the sample interval. */
    perDay: number;
    now: Millis;
}

export function generateReadings(options: GenerateOptions): IndustryReading[] {
    const random = seeded(0x1_d0_57);
    const readings: IndustryReading[] = [];
    const stepMs = 86_400_000 / options.perDay;
    const from = options.now - options.days * 86_400_000;

    for (const machine of MACHINES) {
        const baseline = BASELINES[machine.id] ?? IDLE;
        // An unplanned stop that runs for a few samples, seeded per machine so
        // downtime, MTBF and MTTR are something other than perfect.
        let stopFor = 0;

        for (let index = 0; index < options.days * options.perDay; index += 1) {
            const at = from + index * stepMs;
            const scheduled = isScheduled(at, PRODUCTION_SHIFT);
            const ageDays = (at - from) / 86_400_000;

            if (scheduled && stopFor === 0 && random() < 0.012) {
                stopFor = 1 + Math.floor(random() * 3);
            }

            const running = scheduled && stopFor === 0;
            if (stopFor > 0) stopFor -= 1;

            readings.push(
                running
                    ? runningReading(machine, baseline, options.orgId, at, ageDays, random)
                    : stoppedReading(machine, options.orgId, at, random)
            );
        }
    }

    return readings.sort((a, b) => a.at - b.at);
}

function runningReading(
    machine: Machine,
    baseline: Baseline,
    orgId: string,
    at: Millis,
    ageDays: number,
    random: () => number
): IndustryReading {
    const jitter = (spread: number) => (random() - 0.5) * spread;

    // Vibration climbs slowly, which is what makes the maintenance forecast a
    // forecast rather than a constant.
    const vibration = baseline.vibration + ageDays * baseline.wearPerDay + jitter(0.25);
    const temperature = baseline.temperature + jitter(4);
    const speed = machine.ratedSpeed * baseline.speedFactor + jitter(machine.ratedSpeed * 0.04);

    // The MES figure: performance against rated speed, times a quality factor
    // that wanders in the high nineties.
    const quality = 96 + jitter(3);
    const performance = (speed / machine.ratedSpeed) * 100;

    return {
        platform: 'industry',
        orgId,
        assetId: machine.id,
        at,
        temperature: round(temperature, 1),
        vibration: round(Math.max(0, vibration), 2),
        power: Math.round(baseline.power + jitter(400)),
        speed: Math.round(Math.max(1, speed)),
        oee: round((performance / 100) * quality, 1),
    };
}

/**
 * A stopped machine.
 *
 * OEE is a true zero here, not a missing value — and rendering it is the point
 * of the `MetricCard` fix, since `value || '--'` turned exactly this reading
 * into "no data".
 */
function stoppedReading(
    machine: Machine,
    orgId: string,
    at: Millis,
    random: () => number
): IndustryReading {
    const cooling = machine.type === 'molder' ? 180 : 24;

    return {
        platform: 'industry',
        orgId,
        assetId: machine.id,
        at,
        temperature: round(cooling + random() * 3, 1),
        vibration: round(random() * 0.08, 2),
        power: Math.round(90 + random() * 60),
        speed: 0,
        oee: 0,
    };
}

function round(value: number, digits: number): number {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}
