import {
    fetchAlerts,
    fetchReadings,
    isConfigured,
    type Alert,
    type DataSource,
    type IndustryReading,
    type Millis,
    type Reading,
} from '@cognitex/data';

import { deriveAlerts } from '../domain';
import { generateReadings } from './generate';

/**
 * The console's only data entry point.
 *
 * Two rules, both from `@cognitex/data`'s repository:
 *
 *  1. Firestore when it is configured, the generator otherwise.
 *  2. **The answer always says which one it was.** Every result carries a
 *     `source`, so each view renders `<DataSourceBadge>` and an operator knows
 *     whether they are looking at their plant or at a demonstration. The old
 *     console generated 200 days of machine history in the browser and
 *     presented it as measurement, with nothing on screen to say otherwise.
 *
 * This platform does not write. Readings are produced by the gateway on the
 * plant floor and alerts by the ingestion pipeline; a console that also wrote
 * them would be inventing measurements, and every operator's browser would
 * write its own copy of the same alarm.
 */

export interface ConsoleSnapshot {
    readings: IndustryReading[];
    alerts: Alert[];
    source: DataSource;
    /** When the store answered. Null in generated mode. */
    updatedAt: Millis | null;
    /** Spacing of the feed, used to turn sample counts into durations. */
    sampleMs: number;
}

/** Samples per day the generator produces, and the fallback for a store feed. */
const SAMPLES_PER_DAY = 12;

export function isIndustryReading(reading: Reading): reading is IndustryReading {
    return reading.platform === 'industry';
}

/**
 * The interval between readings, measured rather than assumed.
 *
 * A Firestore feed may be sampled at any rate, and MTBF is a duration — using
 * a hardcoded interval would silently scale every reliability figure by
 * whatever ratio the plant's gateway actually runs at. The median gap is used
 * because one long overnight gap should not stretch the estimate.
 */
export function inferSampleMs(readings: readonly IndustryReading[], fallback: number): number {
    const byAsset = new Map<string, Millis[]>();
    for (const reading of readings) {
        const list = byAsset.get(reading.assetId) ?? [];
        list.push(reading.at);
        byAsset.set(reading.assetId, list);
    }

    const gaps: number[] = [];
    for (const stamps of byAsset.values()) {
        stamps.sort((a, b) => a - b);
        for (let index = 1; index < stamps.length; index += 1) {
            const gap = stamps[index]! - stamps[index - 1]!;
            if (gap > 0) gaps.push(gap);
        }
    }

    if (gaps.length === 0) return fallback;

    gaps.sort((a, b) => a - b);
    return gaps[Math.floor(gaps.length / 2)] ?? fallback;
}

export async function loadSnapshot(options: {
    orgId: string;
    days: number;
    now: Millis;
}): Promise<ConsoleSnapshot> {
    const fallbackSampleMs = 86_400_000 / SAMPLES_PER_DAY;

    if (!isConfigured()) {
        const readings = generateReadings({
            orgId: options.orgId,
            days: options.days,
            perDay: SAMPLES_PER_DAY,
            now: options.now,
        });

        return {
            readings,
            alerts: deriveAlerts(readings, options.orgId),
            source: 'generated',
            updatedAt: null,
            sampleMs: fallbackSampleMs,
        };
    }

    const since = options.now - options.days * 86_400_000;
    const [readingPage, alertPage] = await Promise.all([
        fetchReadings({ orgId: options.orgId, since, max: 2000 }),
        fetchAlerts({ orgId: options.orgId, max: 50 }),
    ]);

    // `isConfigured()` was true a moment ago; if the repository still answered
    // null the configuration went away underneath us, and generated data with
    // an honest badge beats an empty console.
    if (!readingPage) {
        const readings = generateReadings({
            orgId: options.orgId,
            days: options.days,
            perDay: SAMPLES_PER_DAY,
            now: options.now,
        });
        return {
            readings,
            alerts: deriveAlerts(readings, options.orgId),
            source: 'generated',
            updatedAt: null,
            sampleMs: fallbackSampleMs,
        };
    }

    // The union is discriminated on `platform`, so another console's rows
    // cannot leak into this one's charts even if they share a collection.
    const readings = readingPage.items.filter(isIndustryReading);

    return {
        readings,
        alerts: alertPage?.items ?? [],
        source: 'store',
        updatedAt: Date.now(),
        sampleMs: inferSampleMs(readings, fallbackSampleMs),
    };
}
