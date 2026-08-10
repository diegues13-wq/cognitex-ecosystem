/**
 * Maps a telemetry series onto an SVG viewBox.
 *
 * Shared by the server-rendered fallback and the client refresh so both draw
 * the curve identically — otherwise the chart visibly jumps when the fetch
 * lands.
 */

export interface Point {
    /** Epoch milliseconds. */
    at: number;
    kw: number;
}

export interface ChartPaths {
    line: string;
    area: string;
}

/** Vertical padding so a 2px stroke at the extremes is never clipped. */
const PAD = 8;

export function seriesToPaths(series: Point[], width: number, height: number): ChartPaths {
    if (series.length === 0) return { line: '', area: '' };

    const values = series.map((p) => p.kw);
    const min = Math.min(...values);
    const max = Math.max(...values);
    // A flat series would divide by zero; fall back to 1 so it renders as a
    // straight line at the bottom rather than NaN.
    const span = max - min || 1;

    const usable = height - PAD * 2;

    const points = series.map((point, i) => {
        const x = series.length === 1 ? 0 : (i / (series.length - 1)) * width;
        const y = height - PAD - ((point.kw - min) / span) * usable;
        return [x, y] as const;
    });

    const line = points
        .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
        .join(' ');

    return { line, area: `${line} L${width} ${height} L0 ${height} Z` };
}
