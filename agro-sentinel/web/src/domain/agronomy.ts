import { condensationMargin } from './psychrometrics';
import type { GreenhouseSample, Millis } from './types';

/**
 * Crop-facing arithmetic.
 *
 * All five farms are in Ecuador, which sits at UTC−5 the whole year and has
 * never observed daylight saving. A "day" is therefore a fixed 24-hour window
 * offset by five hours from UTC, computed here rather than through the
 * browser's locale — a console open in Madrid must bucket a Cayambe night
 * into the Cayambe day, and a test must not depend on the machine's TZ.
 */

export const DAY_MS = 86_400_000;
export const ECUADOR_UTC_OFFSET_MS = -5 * 3_600_000;

/** Midnight in Ecuador, as epoch milliseconds. */
export function startOfFarmDay(at: Millis): Millis {
    const shifted = at + ECUADOR_UTC_OFFSET_MS;
    return Math.floor(shifted / DAY_MS) * DAY_MS - ECUADOR_UTC_OFFSET_MS;
}

/** `YYYY-MM-DD` in Ecuador. Sorts lexicographically, which is why it is a string. */
export function farmDayKey(at: Millis): string {
    return new Date(at + ECUADOR_UTC_OFFSET_MS).toISOString().slice(0, 10);
}

export interface DayExtremes {
    day: string;
    start: Millis;
    min: number;
    max: number;
    mean: number;
    count: number;
}

/**
 * Per-day minimum, maximum and mean of the air temperature.
 *
 * Days with no readings are absent rather than zero: a gateway that was
 * offline did not record a 0 °C night.
 */
export function dailyTemperature(samples: readonly GreenhouseSample[]): DayExtremes[] {
    const days = new Map<string, { start: Millis; values: number[] }>();

    for (const item of samples) {
        const value = item.airTemperature;
        if (!Number.isFinite(value)) continue;

        const key = farmDayKey(item.at);
        const bucket = days.get(key) ?? { start: startOfFarmDay(item.at), values: [] };
        bucket.values.push(value);
        days.set(key, bucket);
    }

    return [...days.entries()]
        .map(([day, bucket]) => ({
            day,
            start: bucket.start,
            min: Math.min(...bucket.values),
            max: Math.max(...bucket.values),
            mean: bucket.values.reduce((sum, value) => sum + value, 0) / bucket.values.length,
            count: bucket.values.length,
        }))
        .sort((a, b) => a.start - b.start);
}

export interface GddResult {
    days: { day: string; start: Millis; gdd: number }[];
    /** Accumulated over the window. */
    total: number;
    /** The base temperature used, so the figure can be reproduced. */
    base: number;
}

/**
 * Growing degree days, McMaster & Wilhelm (1997) "Method 1".
 *
 *     GDD = max(0, (Tmax + Tmin) / 2 − Tbase)
 *
 * evaluated once per calendar day, not once per reading. The old generator
 * accumulated `max(0, temp − 10) / 24` on every sample
 * (`utils/dataGenerator.js`), which is a different quantity — it integrates
 * the temperature curve instead of using the daily mean, and it silently
 * changed value when the sampling interval changed, so the "acumulado
 * temporada" on screen depended on how often the sensor happened to report.
 *
 * Method 2 (clamping Tmax and Tmin to the base first) is the other common
 * convention and gives a slightly larger figure on days that dip below base;
 * Method 1 is the one that matches published crop tables.
 */
export function growingDegreeDays(
    samples: readonly GreenhouseSample[],
    base = 10
): GddResult {
    const days = dailyTemperature(samples).map((day) => ({
        day: day.day,
        start: day.start,
        gdd: Math.max(0, (day.max + day.min) / 2 - base),
    }));

    return {
        days,
        total: days.reduce((sum, day) => sum + day.gdd, 0),
        base,
    };
}

export interface DliResult {
    days: { day: string; start: Millis; dli: number }[];
    /** Mean over the days that have readings. Zero when there are none. */
    mean: number;
}

/**
 * Daily light integral, mol·m⁻²·day⁻¹.
 *
 *     DLI = Σ PAR(t) · Δt / 1 000 000
 *
 * PAR arrives as an instantaneous µmol·m⁻²·s⁻¹ flux, so each reading is held
 * for the interval until the next one — a rectangle rule, which is what every
 * greenhouse controller does. It is the number that decides whether a rose
 * crop needs supplementary light, and it is what the old console's "Radiación
 * PAR" card could not tell you: an instantaneous flux says nothing about the
 * day's total.
 */
export function dailyLightIntegral(samples: readonly GreenhouseSample[]): DliResult {
    const ordered = [...samples].sort((a, b) => a.at - b.at);
    const totals = new Map<string, { start: Millis; micromoles: number }>();

    for (let index = 0; index < ordered.length; index += 1) {
        const item = ordered[index]!;
        if (!Number.isFinite(item.par)) continue;

        // The last reading of the window is held for the median interval, so
        // a partial day is not inflated by an arbitrary tail.
        const next = ordered[index + 1];
        const span = next ? next.at - item.at : 0;
        if (span <= 0) continue;

        const key = farmDayKey(item.at);
        const bucket = totals.get(key) ?? { start: startOfFarmDay(item.at), micromoles: 0 };
        bucket.micromoles += (item.par * span) / 1000;
        totals.set(key, bucket);
    }

    const days = [...totals.entries()]
        .map(([day, bucket]) => ({
            day,
            start: bucket.start,
            // µmol·s → mol: divide by 1e6. The span above was in milliseconds
            // and already divided by 1e3.
            dli: bucket.micromoles / 1_000_000,
        }))
        .sort((a, b) => a.start - b.start);

    return {
        days,
        mean: days.length === 0 ? 0 : days.reduce((sum, day) => sum + day.dli, 0) / days.length,
    };
}

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface BotrytisRisk {
    level: RiskLevel;
    /** 0-100, for a bar. Not a probability, and not labelled as one. */
    index: number;
    /** Why, in one clause, already translated. */
    reason: string;
}

/**
 * Botrytis cinerea pressure — a screening heuristic, not an epidemiological model.
 *
 * The HIGH rule is exactly `cloud/main.py:194`: 15-25 °C with relative
 * humidity above 85%, which is the classic infection window for grey mould.
 * MEDIUM adds the condition that actually starts an outbreak and that neither
 * the Python nor the old JavaScript looked at — free water on the leaf, which
 * is a dew point within two degrees of the air temperature.
 *
 * The old browser version computed
 * `((humidity − 60) / 40) * 50 + ((temp − 20) / 10) * 50` and printed the
 * result as "Botrytis: 87% probabilidad". It was not a probability of
 * anything, and above 25 °C — where the fungus slows down — it went up.
 */
export function botrytisRisk(
    temperatureC: number | null,
    relativeHumidity: number | null
): BotrytisRisk {
    if (
        temperatureC === null ||
        relativeHumidity === null ||
        !Number.isFinite(temperatureC) ||
        !Number.isFinite(relativeHumidity)
    ) {
        return { level: 'LOW', index: 0, reason: 'Sin lecturas de clima' };
    }

    const inWindow = temperatureC >= 15 && temperatureC <= 25;
    const margin = condensationMargin(temperatureC, relativeHumidity);
    const wet = margin !== null && margin <= 2;

    if (inWindow && relativeHumidity > 85) {
        return {
            level: 'HIGH',
            index: 85,
            reason: `${temperatureC.toFixed(1)} °C con ${relativeHumidity.toFixed(0)}% de humedad: ventana de infección`,
        };
    }

    if (wet) {
        return {
            level: 'MEDIUM',
            index: 60,
            reason: `Punto de rocío a ${margin.toFixed(1)} °C del aire: riesgo de condensación en hoja`,
        };
    }

    if (inWindow && relativeHumidity > 80) {
        return {
            level: 'MEDIUM',
            index: 45,
            reason: 'Temperatura favorable y humedad alta',
        };
    }

    return {
        level: 'LOW',
        index: relativeHumidity > 70 ? 25 : 10,
        reason: 'Fuera de la ventana de infección',
    };
}
