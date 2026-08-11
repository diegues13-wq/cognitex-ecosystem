import type { PersonalReading } from '@cognitex/data';
import type { SeriesPoint } from '@cognitex/ui';

/**
 * Readings to chart points.
 *
 * The measurements a chart can show, named. The old dashboard selected them
 * with `dataKey={selectedVariable === 'BODYTEMP' ? 'temp' : selectedVariable
 * === 'HR' ? 'vpd' : 'humidity'}` — a chain of string comparisons resolving to
 * another platform's field name, which is the aliasing this migration exists
 * to remove.
 */
export type Measurement = 'heartRate' | 'fatigue' | 'bodyTemperature' | 'wearableBattery';

export interface MeasurementMeta {
    id: Measurement;
    label: string;
    unit: string;
    precision: number;
}

export const MEASUREMENTS: Record<Measurement, MeasurementMeta> = {
    heartRate: { id: 'heartRate', label: 'Ritmo cardíaco', unit: 'bpm', precision: 0 },
    fatigue: { id: 'fatigue', label: 'Índice de fatiga', unit: '%', precision: 0 },
    bodyTemperature: {
        id: 'bodyTemperature',
        label: 'Temperatura corporal',
        unit: '°C',
        precision: 1,
    },
    wearableBattery: {
        id: 'wearableBattery',
        label: 'Batería del casco',
        unit: '%',
        precision: 0,
    },
};

export function toSeries(
    readings: readonly PersonalReading[],
    measurement: Measurement
): SeriesPoint[] {
    return [...readings]
        .sort((a, b) => a.at - b.at)
        .map((reading) => ({ at: reading.at, value: reading[measurement] }));
}

/** The most recent reading for a worker, or null when they have never reported. */
export function latestFor(
    readings: readonly PersonalReading[],
    assetId: string
): PersonalReading | null {
    let latest: PersonalReading | null = null;
    for (const reading of readings) {
        if (reading.assetId !== assetId) continue;
        if (!latest || reading.at > latest.at) latest = reading;
    }
    return latest;
}
