import type { IndustryReading, Millis } from '@cognitex/data';
import type { SeriesPoint } from '@cognitex/ui';

import { isScheduled, startOfDay } from './shift';
import type { Shift } from './types';

/**
 * Readings to chart points.
 *
 * The measurements a chart can show, named. The old dashboard selected them
 * with `dataKey={selectedVariable === 'TEMP' ? 'temp' : ... : 'battery'}` —
 * a chain of string comparisons resolving to the wrong physical quantity's
 * field name, which is the aliasing this migration exists to remove.
 */
export type Measurement = 'temperature' | 'vibration' | 'power' | 'speed' | 'oee';

export interface MeasurementMeta {
    id: Measurement;
    label: string;
    unit: string;
    precision: number;
}

export const MEASUREMENTS: Record<Measurement, MeasurementMeta> = {
    temperature: { id: 'temperature', label: 'Temperatura', unit: '°C', precision: 1 },
    vibration: { id: 'vibration', label: 'Vibración RMS', unit: 'mm/s', precision: 2 },
    power: { id: 'power', label: 'Potencia', unit: 'W', precision: 0 },
    speed: { id: 'speed', label: 'Velocidad', unit: 'rpm', precision: 0 },
    oee: { id: 'oee', label: 'OEE', unit: '%', precision: 0 },
};

export function toSeries(
    readings: readonly IndustryReading[],
    measurement: Measurement
): SeriesPoint[] {
    return [...readings]
        .sort((a, b) => a.at - b.at)
        .map((reading) => ({ at: reading.at, value: reading[measurement] }));
}

/**
 * Mean OEE per day over scheduled time, oldest first.
 *
 * One point per day that had scheduled readings. Days the plant did not run
 * are absent rather than plotted as zero: a closed Sunday is not a bad day.
 */
export function dailyOee(
    readings: readonly IndustryReading[],
    shift: Shift
): SeriesPoint[] {
    const byDay = new Map<Millis, { sum: number; count: number }>();

    for (const reading of readings) {
        if (!isScheduled(reading.at, shift)) continue;
        const day = startOfDay(reading.at);
        const bucket = byDay.get(day) ?? { sum: 0, count: 0 };
        bucket.sum += reading.oee;
        bucket.count += 1;
        byDay.set(day, bucket);
    }

    return [...byDay.entries()]
        .sort(([a], [b]) => a - b)
        .map(([day, bucket]) => ({ at: day, value: bucket.sum / bucket.count }));
}

/** The most recent reading for an asset, or null when it has never reported. */
export function latestFor(
    readings: readonly IndustryReading[],
    assetId: string
): IndustryReading | null {
    let latest: IndustryReading | null = null;
    for (const reading of readings) {
        if (reading.assetId !== assetId) continue;
        if (!latest || reading.at > latest.at) latest = reading;
    }
    return latest;
}
