import type { SeriesPoint } from '@cognitex/ui';

import type { ChannelId, GreenhouseSample, Millis } from './types';

/**
 * Turning a window of samples into something a chart or a summary can use.
 *
 * Two rules run through everything here:
 *
 *  · A channel that was not measured is skipped, not zeroed. The old console
 *    plotted `undefined` as a gap in one place and as 0 in another, so a
 *    missing soil probe drew a line to the floor.
 *  · Nothing reads the clock. Every function takes the window it is given,
 *    which is what makes them testable and what makes a render reproducible.
 */

function valueAt(item: GreenhouseSample, channel: ChannelId): number | null {
    const raw = item[channel];
    return typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
}

/** Points for `TimeSeriesChart`, oldest first, gaps dropped. */
export function toSeries(
    samples: readonly GreenhouseSample[],
    channel: ChannelId
): SeriesPoint[] {
    return samples
        .map((item) => {
            const value = valueAt(item, channel);
            return value === null ? null : { at: item.at, value };
        })
        .filter((point): point is SeriesPoint => point !== null)
        .sort((a, b) => a.at - b.at);
}

export interface ChannelStats {
    count: number;
    min: number;
    max: number;
    mean: number;
    /** The most recent measured value. */
    latest: number;
    /** When each of those happened. */
    minAt: Millis;
    maxAt: Millis;
    latestAt: Millis;
}

/**
 * Minimum, maximum, mean and latest of one channel.
 *
 * Null when the channel was never measured in the window — which is different
 * from "the values were all zero", and the caller has to say which it is.
 */
export function statsFor(
    samples: readonly GreenhouseSample[],
    channel: ChannelId
): ChannelStats | null {
    let count = 0;
    let sum = 0;
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    let minAt = 0;
    let maxAt = 0;
    let latest = 0;
    let latestAt = Number.NEGATIVE_INFINITY;

    for (const item of samples) {
        const value = valueAt(item, channel);
        if (value === null) continue;

        count += 1;
        sum += value;

        if (value < min) {
            min = value;
            minAt = item.at;
        }
        if (value > max) {
            max = value;
            maxAt = item.at;
        }
        if (item.at >= latestAt) {
            latest = value;
            latestAt = item.at;
        }
    }

    if (count === 0) return null;

    return { count, min, max, mean: sum / count, latest, minAt, maxAt, latestAt };
}

/** The most recent sample in a window, or null. Never assumes sorted input. */
export function latestSample(
    samples: readonly GreenhouseSample[]
): GreenhouseSample | null {
    return samples.reduce<GreenhouseSample | null>(
        (best, item) => (best === null || item.at > best.at ? item : best),
        null
    );
}

/**
 * Thins a series to at most `max` points by averaging equal-width buckets.
 *
 * A 30-day window at one reading every five minutes is 8 640 points drawn
 * into a 640-unit-wide SVG; a browser will render it, but every stroke past
 * the tenth per pixel is wasted work and the line stops being readable.
 * Averaging rather than sampling keeps the shape — dropping every other point
 * loses exactly the spikes an alarm console exists to show.
 */
export function downsample(points: readonly SeriesPoint[], max: number): SeriesPoint[] {
    if (max <= 0) return [];
    if (points.length <= max) return [...points];

    const size = points.length / max;
    const out: SeriesPoint[] = [];

    for (let index = 0; index < max; index += 1) {
        const start = Math.floor(index * size);
        const end = Math.min(points.length, Math.floor((index + 1) * size));
        if (end <= start) continue;

        let sum = 0;
        for (let cursor = start; cursor < end; cursor += 1) sum += points[cursor]!.value;

        out.push({
            at: points[start]!.at,
            value: sum / (end - start),
        });
    }

    return out;
}

/**
 * Change between the first and second half of the window, as a fraction.
 *
 * Null when either half is empty or the earlier half averages zero — a
 * "+∞%" on a metric card is worse than no trend at all.
 */
export function trendOf(
    samples: readonly GreenhouseSample[],
    channel: ChannelId
): number | null {
    const points = toSeries(samples, channel);
    if (points.length < 4) return null;

    const half = Math.floor(points.length / 2);
    const mean = (slice: SeriesPoint[]) =>
        slice.reduce((sum, point) => sum + point.value, 0) / slice.length;

    const before = mean(points.slice(0, half));
    const after = mean(points.slice(half));

    if (before === 0) return null;

    return (after - before) / Math.abs(before);
}
