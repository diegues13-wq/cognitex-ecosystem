import {
    fetchAlerts,
    fetchReadings,
    isConfigured,
    type Alert,
    type DataSource,
    type Millis,
    type PersonalReading,
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
 *     `source`, so each view renders `<DataSourceBadge>` and a supervisor
 *     knows whether they are looking at their crew or at a demonstration. The
 *     old console generated 200 days of biometrics in the browser and
 *     presented them as measurement, with nothing on screen to say otherwise.
 *
 * This platform does not write. Readings come from the helmets through the
 * gateway and alerts from the ingestion pipeline; a console that wrote them
 * would be inventing measurements about a person's body, and every open
 * browser would write its own copy of the same man-down alarm.
 */

export interface ConsoleSnapshot {
    readings: PersonalReading[];
    alerts: Alert[];
    source: DataSource;
    /** When the store answered. Null in generated mode. */
    updatedAt: Millis | null;
}

/** Samples per day the generator produces. */
const SAMPLES_PER_DAY = 24;

export function isPersonalReading(reading: Reading): reading is PersonalReading {
    return reading.platform === 'personal';
}

export async function loadSnapshot(options: {
    orgId: string;
    days: number;
    now: Millis;
}): Promise<ConsoleSnapshot> {
    if (!isConfigured()) return generated(options);

    const since = options.now - options.days * 86_400_000;
    const [readingPage, alertPage] = await Promise.all([
        fetchReadings({ orgId: options.orgId, since, max: 2000 }),
        fetchAlerts({ orgId: options.orgId, max: 50 }),
    ]);

    // `isConfigured()` was true a moment ago; if the repository still answered
    // null the configuration went away underneath us, and generated data with
    // an honest badge beats an empty console.
    if (!readingPage) return generated(options);

    // The union is discriminated on `platform`, so another console's rows
    // cannot leak into this one's charts even if they share a collection.
    return {
        readings: readingPage.items.filter(isPersonalReading),
        alerts: alertPage?.items ?? [],
        source: 'store',
        updatedAt: Date.now(),
    };
}

function generated(options: {
    orgId: string;
    days: number;
    now: Millis;
}): ConsoleSnapshot {
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
    };
}
