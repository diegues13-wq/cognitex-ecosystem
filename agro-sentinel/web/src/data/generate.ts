import { vapourPressureDeficit } from '../domain';
import type { Farm, GreenhouseSample, Millis, ThermalScan } from '../domain';

/**
 * The demonstration greenhouse.
 *
 * Only ever reached when Firebase is not configured, and everything it
 * produces is labelled `Datos simulados` on screen.
 *
 * Three things differ from `utils/dataGenerator.js`:
 *
 *  · **It is deterministic.** The old generator called `Math.random()`
 *    directly, so every reload produced a different history and two operators
 *    looking at the same demo saw different numbers. One seed, one stream.
 *  · **VPD is computed, not stored twice.** The old file carried its own copy
 *    of the Magnus formula; this one calls the domain function the console
 *    uses everywhere else, so the demonstration cannot disagree with the
 *    physics.
 *  · **Anomalies land inside plausible physics.** A 35 °C spike still carries
 *    the humidity, VPD and dew point that go with it, instead of the old
 *    `temp = baseTemp + 20` that left the humidity untouched and produced
 *    readings no real greenhouse could take.
 */

/** Numerical Recipes' LCG — small, fast, identical across engines. */
function seeded(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 0x1_0000_0000;
    };
}

/** A seed that depends on the farm, so the five demos are not identical. */
function seedFor(farmId: string): number {
    let hash = 0x5eed_42;
    for (let index = 0; index < farmId.length; index += 1) {
        hash = (Math.imul(hash, 31) + farmId.charCodeAt(index)) >>> 0;
    }
    return hash;
}

/** Hour of the day in Ecuador, from an epoch instant. */
function farmHour(at: Millis): number {
    return new Date(at - 5 * 3_600_000).getUTCHours();
}

function clamp(value: number, low: number, high: number): number {
    return Math.min(high, Math.max(low, value));
}

export interface GenerateOptions {
    farm: Farm;
    orgId: string;
    /** Window length in hours. */
    hours: number;
    /** Minutes between readings. */
    stepMinutes: number;
    now: Millis;
}

export function generateSamples(options: GenerateOptions): GreenhouseSample[] {
    const random = seeded(seedFor(options.farm.id));
    const step = options.stepMinutes * 60_000;
    const count = Math.max(1, Math.round((options.hours * 60) / options.stepMinutes));
    const start = options.now - (count - 1) * step;

    const samples: GreenhouseSample[] = [];
    let soilMoisture = 62 + random() * 8;
    let battery = 88 + random() * 8;

    for (let index = 0; index < count; index += 1) {
        const at = start + index * step;
        const hour = farmHour(at);
        const daylight = hour >= 6 && hour <= 18 ? Math.sin(((hour - 6) / 12) * Math.PI) : 0;
        const noise = () => (random() - 0.5) * 2;

        // Sierra farms swing more between day and night than coastal ones;
        // altitude is the reason Cayambe can touch zero at 04:00.
        const swing = options.farm.altitude > 1500 ? 7 : 4;

        let airTemperature = options.farm.baseTemperature + swing * daylight + noise();
        let humidity = clamp(
            options.farm.baseHumidity - daylight * 18 + noise() * 4,
            18,
            99
        );

        // Photosynthesis pulls CO2 down in the light and respiration pushes it
        // back up at night — the real curve, and the reason a flat 800 ppm in
        // the data means the sensor has stopped.
        let co2 = clamp(
            (daylight > 0 ? 420 : 620) - daylight * 60 + noise() * 25,
            300,
            2500
        );

        soilMoisture = clamp(soilMoisture - 0.12 - daylight * 0.1 + noise() * 0.15, 20, 92);
        // Irrigation, every eight hours.
        if (index > 0 && index % Math.max(1, Math.round(480 / options.stepMinutes)) === 0) {
            soilMoisture = clamp(68 + random() * 6, 20, 92);
        }

        const par = Math.round(daylight * (780 + random() * 320));

        battery = clamp(battery + (daylight > 0 ? 0.05 : -0.04), 5, 100);
        const rssiDbm = Math.round(clamp(-62 + noise() * 8, -95, -30));

        // One excursion in roughly sixty readings, so the alarm list has
        // something in it without the console looking like a disaster.
        const roll = random();
        if (roll < 0.008) {
            airTemperature += 12;
            humidity = clamp(humidity - 22, 12, 99);
        } else if (roll < 0.014) {
            co2 = 1900 + random() * 200;
        } else if (roll < 0.02) {
            soilMoisture = 21 + random() * 3;
        } else if (roll < 0.023) {
            battery = 11;
        }

        const vpd = vapourPressureDeficit(airTemperature, humidity) ?? 0;

        samples.push({
            platform: 'agro',
            orgId: options.orgId,
            assetId: options.farm.id,
            at,
            airTemperature: round(airTemperature, 1),
            humidity: round(humidity, 1),
            vpd: round(vpd, 2),
            co2: Math.round(co2),
            soilMoisture: round(soilMoisture, 1),
            par,
            batteryPct: Math.round(battery),
            rssiDbm,
            soilEc: round(1.2 + noise() * 0.08, 2),
            soilTemperature: round(airTemperature - 2 + noise() * 0.4, 1),
        });
    }

    return samples;
}

function round(value: number, digits: number): number {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}

/**
 * Demonstration thermal scans.
 *
 * Marked `stub: false` — these are honestly generated, varied numbers. The
 * scans that carry `stub: true` are the ones read back from Firestore, where
 * `cloud/thermal.py` wrote a fixed 42.5 °C. Doing it the other way round
 * would have the demo look more trustworthy than production.
 */
export function generateScans(options: {
    farm: Farm;
    samples: readonly GreenhouseSample[];
    now: Millis;
    count?: number;
}): ThermalScan[] {
    const random = seeded(seedFor(options.farm.id) ^ 0x7ea1);
    const total = options.count ?? 4;
    const scans: ThermalScan[] = [];

    for (let index = 0; index < total; index += 1) {
        const at = options.now - index * 6 * 3_600_000;
        const ambient = nearestAmbient(options.samples, at);
        const delta = index === 0 ? 4 + random() * 3 : random() < 0.3 ? 14 + random() * 9 : random() * 6;

        scans.push({
            id: `gen-scan-${options.farm.id}-${index}`,
            farmId: options.farm.id,
            at,
            maxTemperature: round((ambient ?? 22) + delta, 1),
            ambientTemperature: ambient,
            anomaly: delta > 10,
            description:
                delta > 10
                    ? 'Punto caliente localizado en el cuadrante superior derecho'
                    : 'Distribución térmica uniforme',
            stub: false,
        });
    }

    return scans;
}

function nearestAmbient(
    samples: readonly GreenhouseSample[],
    at: Millis
): number | null {
    let best: GreenhouseSample | null = null;
    for (const item of samples) {
        if (best === null || Math.abs(item.at - at) < Math.abs(best.at - at)) best = item;
    }
    // More than three hours away is not the ambient temperature of that scan.
    if (best === null || Math.abs(best.at - at) > 3 * 3_600_000) return null;

    return best.airTemperature;
}
