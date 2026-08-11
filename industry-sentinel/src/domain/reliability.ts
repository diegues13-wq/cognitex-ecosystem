import type { IndustryReading, Millis } from '@cognitex/data';

import { isRunning } from './oee';
import { isScheduled } from './shift';
import type { DowntimeEpisode, Shift } from './types';

/**
 * Downtime, MTBF and MTTR.
 *
 * The sidebar these replace said "Disponibilidad 98.2%" and "Mantenimiento EN
 * 150H" as literal strings in the markup, for every machine, forever.
 *
 * An episode begins at the first stopped reading inside scheduled time and
 * ends when the machine next reports as turning. The trailing edge is the
 * timestamp of the reading that *resumed* production, not of the last stopped
 * sample — a stop is only over when something moves again, and taking the
 * earlier stamp would systematically under-report every stop by one sample
 * interval.
 *
 * A window that ends mid-stop yields an unresolved episode: it is closed at
 * the last reading so the duration is a lower bound, and flagged so a view can
 * say "en curso" rather than implying the machine came back.
 */

export function downtimeEpisodes(
    readings: readonly IndustryReading[],
    shift: Shift
): DowntimeEpisode[] {
    const ordered = [...readings].sort((a, b) => a.at - b.at);
    const episodes: DowntimeEpisode[] = [];

    let openedAt: Millis | null = null;
    let assetId = '';
    let lastAt: Millis | null = null;

    for (const reading of ordered) {
        if (!isScheduled(reading.at, shift)) {
            // Off-shift. Close anything open at the last scheduled reading:
            // the machine stopping because the shift ended is not a failure.
            if (openedAt !== null && lastAt !== null) {
                episodes.push(episode(assetId, openedAt, lastAt, false));
                openedAt = null;
            }
            continue;
        }

        if (isRunning(reading)) {
            if (openedAt !== null) {
                episodes.push(episode(assetId, openedAt, reading.at, true));
                openedAt = null;
            }
        } else if (openedAt === null) {
            openedAt = reading.at;
            assetId = reading.assetId;
        }

        lastAt = reading.at;
    }

    if (openedAt !== null && lastAt !== null) {
        episodes.push(episode(assetId, openedAt, lastAt, false));
    }

    return episodes;
}

function episode(
    assetId: string,
    from: Millis,
    to: Millis,
    resolved: boolean
): DowntimeEpisode {
    return { assetId, from, to, durationMs: Math.max(0, to - from), resolved };
}

export interface Reliability {
    episodes: number;
    downtimeMs: number;
    /** Scheduled time the machine was turning. */
    uptimeMs: number;
    /**
     * Mean time between failures. Null when nothing failed — a machine that
     * never stopped has no MTBF, and reporting zero says the opposite.
     */
    mtbfMs: number | null;
    /** Mean time to repair. Null when nothing failed. */
    mttrMs: number | null;
    /** 0-100. Uptime over scheduled time. */
    availability: number;
}

const NO_FAILURES: Reliability = {
    episodes: 0,
    downtimeMs: 0,
    uptimeMs: 0,
    mtbfMs: null,
    mttrMs: null,
    availability: 0,
};

/**
 * Reliability over a window.
 *
 * `sampleMs` is the spacing of the feed: each scheduled reading stands for one
 * interval of scheduled time. Passing the real interval is what makes MTBF a
 * duration rather than a sample count.
 */
export function reliability(
    readings: readonly IndustryReading[],
    options: { shift: Shift; sampleMs: number }
): Reliability {
    let scheduled = 0;
    let running = 0;

    for (const reading of readings) {
        if (!isScheduled(reading.at, options.shift)) continue;
        scheduled += 1;
        if (isRunning(reading)) running += 1;
    }

    if (scheduled === 0) return NO_FAILURES;

    const episodes = downtimeEpisodes(readings, options.shift);
    const uptimeMs = running * options.sampleMs;
    const downtimeMs = episodes.reduce((sum, item) => sum + item.durationMs, 0);

    return {
        episodes: episodes.length,
        downtimeMs,
        uptimeMs,
        mtbfMs: episodes.length === 0 ? null : uptimeMs / episodes.length,
        mttrMs: episodes.length === 0 ? null : downtimeMs / episodes.length,
        availability: (running / scheduled) * 100,
    };
}

/** The longest stops first, for the panel that asks what to fix. */
export function worstEpisodes(
    episodes: readonly DowntimeEpisode[],
    max = 10
): DowntimeEpisode[] {
    return [...episodes].sort((a, b) => b.durationMs - a.durationMs).slice(0, max);
}
