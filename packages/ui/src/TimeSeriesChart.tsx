import { useId, useMemo } from 'react';

/**
 * Time-series chart, drawn as plain SVG.
 *
 * Deliberately not recharts. Commit 6d2cbfdd removed recharts from
 * transport-sentinel to stop a SIGILL crash, and it was replaced by 334 lines
 * of bespoke SVG that only that app could use. Meanwhile four other apps kept
 * recharts. This is the shared version of the safe approach: no charting
 * dependency, no canvas, no filters, nothing that reaches an AVX2 code path.
 *
 * It also drops ~180KB of vendor JavaScript from every app that used recharts.
 */

export interface SeriesPoint {
    at: number;
    value: number;
}

export interface TimeSeriesChartProps {
    points: SeriesPoint[];
    /** Accessible description — required, this is data. */
    label: string;
    unit?: string;
    height?: number;
    /** Optional acceptable band, drawn behind the line. */
    band?: { low: number; high: number };
}

const VIEW_W = 640;
const PAD_Y = 10;

export function TimeSeriesChart({
    points,
    label,
    unit = '',
    height = 200,
    band,
}: TimeSeriesChartProps) {
    const gradientId = useId();

    const geometry = useMemo(() => {
        if (points.length === 0) return null;

        const values = points.map((p) => p.value);
        const lo = Math.min(...values, band?.low ?? Infinity);
        const hi = Math.max(...values, band?.high ?? -Infinity);
        // A flat series must render as a line, not divide by zero.
        const span = hi - lo || 1;
        const usable = height - PAD_Y * 2;

        const toY = (value: number) => height - PAD_Y - ((value - lo) / span) * usable;

        const coords = points.map((point, i) => {
            const x = points.length === 1 ? 0 : (i / (points.length - 1)) * VIEW_W;
            return [x, toY(point.value)] as const;
        });

        const line = coords
            .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
            .join(' ');

        return {
            line,
            area: `${line} L${VIEW_W} ${height} L0 ${height} Z`,
            bandRect: band
                ? { y: toY(band.high), height: Math.abs(toY(band.low) - toY(band.high)) }
                : null,
            lo,
            hi,
        };
    }, [points, height, band]);

    if (!geometry) {
        return (
            <p className="flex items-center justify-center text-sm text-steel" style={{ height }}>
                Sin datos en el periodo
            </p>
        );
    }

    const latest = points.at(-1)?.value;

    return (
        <figure className="m-0">
            <svg
                viewBox={`0 0 ${VIEW_W} ${height}`}
                className="w-full"
                preserveAspectRatio="none"
                role="img"
                aria-label={`${label}${
                    latest === undefined ? '' : `. Último valor ${latest.toFixed(1)} ${unit}`
                }. Mínimo ${geometry.lo.toFixed(1)}, máximo ${geometry.hi.toFixed(1)}.`}
            >
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {geometry.bandRect && (
                    <rect
                        x="0"
                        y={geometry.bandRect.y}
                        width={VIEW_W}
                        height={geometry.bandRect.height}
                        fill="var(--color-ok)"
                        fillOpacity="0.08"
                    />
                )}

                <path d={geometry.area} fill={`url(#${gradientId})`} />
                <path
                    d={geometry.line}
                    fill="none"
                    stroke="var(--color-brand)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>

            <figcaption className="mt-2 flex justify-between text-xs text-steel">
                <span>{label}</span>
                <span className="tabular">
                    {geometry.lo.toFixed(1)} – {geometry.hi.toFixed(1)} {unit}
                </span>
            </figcaption>
        </figure>
    );
}
