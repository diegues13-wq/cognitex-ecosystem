import type { Millis, PersonalReading } from '@cognitex/data';

import { WORKERS, WORK_SHIFT, hoursOnShift, isOnShift, maxHeartRate } from '../domain';
import type { Worker } from '../domain';

/**
 * The demonstration crew.
 *
 * Only reached when Firebase is not configured, and everything it produces is
 * labelled `Datos simulados` on screen.
 *
 * It emits `PersonalReading`, so heart rate is `heartRate` rather than `vpd`,
 * fatigue is `fatigue` rather than `humidity`, body temperature is
 * `bodyTemperature` rather than `temp`, and man-down is a boolean rather than
 * a 0/1 in the `co2` slot whose polarity the old generator inverted.
 *
 * It is also deterministic: the original called `Math.random()` for every
 * sample, so two supervisors looking at the same demonstration saw different
 * crews and a screenshot could not be reproduced.
 */

/** Numerical Recipes' LCG — small, fast, identical across engines. */
function seeded(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 0x1_0000_0000;
    };
}

export interface GenerateOptions {
    orgId: string;
    days: number;
    /** Samples per day. The console reads this back as the sample interval. */
    perDay: number;
    now: Millis;
}

export function generateReadings(options: GenerateOptions): PersonalReading[] {
    const random = seeded(0x5a_fe_71);
    const readings: PersonalReading[] = [];
    const stepMs = 86_400_000 / options.perDay;
    const from = options.now - options.days * 86_400_000;

    for (const worker of WORKERS) {
        // A fall lasting a couple of samples, rare enough that most of the
        // demonstration is a crew that is fine — which is the point, since the
        // defect this replaces made every worked hour look like a fall.
        let downFor = 0;

        for (let index = 0; index < options.days * options.perDay; index += 1) {
            const at = from + index * stepMs;
            const onShift = isOnShift(at, WORK_SHIFT);

            if (onShift && downFor === 0 && random() < 0.0015) {
                downFor = 1 + Math.floor(random() * 2);
            }

            const manDown = downFor > 0;
            if (downFor > 0) downFor -= 1;

            readings.push(sample(worker, options.orgId, at, onShift, manDown, random));
        }
    }

    return readings.sort((a, b) => a.at - b.at);
}

function sample(
    worker: Worker,
    orgId: string,
    at: Millis,
    onShift: boolean,
    manDown: boolean,
    random: () => number
): PersonalReading {
    const jitter = (spread: number) => (random() - 0.5) * spread;
    const elapsed = hoursOnShift(at, WORK_SHIFT);

    // Heart rate climbs through the shift and settles back at rest.
    const reserve = maxHeartRate(worker.age) - worker.restingHeartRate;
    const effort = onShift ? 0.28 + elapsed * 0.025 : 0.04;
    const heartRate = worker.restingHeartRate + reserve * effort + jitter(8);

    const fatigue = onShift ? Math.min(100, elapsed * 8 + jitter(9)) : Math.max(0, jitter(6));
    const bodyTemperature = 36.7 + (onShift ? 0.25 + elapsed * 0.035 : 0) + jitter(0.2);

    // The helmet charges overnight and drains across the shift.
    const battery = onShift ? Math.max(4, 96 - elapsed * 7 - random() * 4) : 96 + jitter(4);

    // Heat and cardiac spikes, so the exposure windows have something to find.
    const strained = onShift && random() < 0.03;

    return {
        platform: 'personal',
        orgId,
        assetId: worker.id,
        at,
        heartRate: Math.round(Math.max(40, heartRate + (strained ? 34 : 0))),
        fatigue: Math.round(Math.max(0, fatigue + (strained ? 18 : 0))),
        bodyTemperature: round(bodyTemperature + (strained ? 1.3 : 0), 1),
        wearableBattery: Math.round(Math.min(100, battery)),
        // A boolean. The whole reason this schema exists.
        manDown,
    };
}

function round(value: number, digits: number): number {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}
