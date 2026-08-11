import type { SeriesPoint } from '@cognitex/ui';

/**
 * Builds a chart series and drops anything that is not a real number.
 *
 * `TimeSeriesChart` takes the min and max of its input with `Math.min`, so a
 * single `NaN` — an absent field, a `null` from the store, a date that failed
 * to parse — poisons the whole scale and the component emits
 * `d="M0.0 NaN L22.1 NaN …"`, which the browser rejects. The chart then
 * disappears with nothing but a console error to say why.
 *
 * That is not hypothetical here: during a rolling Cloud Run deploy the
 * previous API revision is still answering, and it does not have the fields
 * the new bundle asks for. Filtering at the boundary means a partial series
 * draws a shorter line instead of no line at all.
 */
export function toSeries<T>(
    rows: T[],
    at: (row: T) => number,
    value: (row: T) => number
): SeriesPoint[] {
    const points: SeriesPoint[] = [];

    for (const row of rows) {
        const x = at(row);
        const y = value(row);
        if (Number.isFinite(x) && Number.isFinite(y)) points.push({ at: x, value: y });
    }

    return points;
}

/** `yyyy-MM-dd` to epoch millis, or NaN — which `toSeries` then drops. */
export function dayToMillis(date: string): number {
    return Date.parse(date);
}
