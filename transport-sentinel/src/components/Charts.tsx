/**
 * The two chart forms the shared package does not carry.
 *
 * Every time series in this console now uses `TimeSeriesChart` from
 * @cognitex/ui — same plain-SVG approach, no charting dependency, nothing
 * that reaches a vectorised code path. What is left here is categorical:
 * counts across a handful of named buckets, which a time-series component
 * cannot express. Both are plain SVG for the same reason as everything else.
 *
 * Colour follows the design system rather than decorating the data. A bucket
 * set that *is* a status ladder (delay bands) uses the shared ok/warn/alert
 * tokens; a bucket set that is merely identity (order types, weeks) uses one
 * brand hue and lets the axis label carry the identity — the shared theme has
 * one accent by design, and inventing a categorical ramp here would fork it.
 */

export interface Bucket {
    label: string;
    value: number;
    /** A CSS colour, normally one of the shared status tokens. */
    color?: string;
    /** Long form for the tooltip, when the axis label is abbreviated. */
    title?: string;
}

const BRAND = 'var(--color-brand)';

function formatCount(value: number): string {
    if (!Number.isFinite(value)) return '—';
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

// ── Vertical bars ───────────────────────────────────────────────────────────

export interface BarChartProps {
    data: Bucket[];
    /** Accessible description — this is data, so it is required. */
    label: string;
    height?: number;
    format?: (value: number) => string;
}

const VIEW_W = 460;

export function BarChart({ data, label, height = 160, format = formatCount }: BarChartProps) {
    if (data.length === 0) return <ChartEmpty height={height} />;

    const pad = { top: 12, right: 8, bottom: 30, left: 34 };
    const plotW = VIEW_W - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    const max = Math.max(...data.map((bucket) => bucket.value), 1);
    const step = plotW / data.length;
    // A 2px surface gap between adjacent bars keeps them from reading as one mass.
    const barW = Math.max(step - 6, 3);

    const ticks = [0, 0.5, 1];

    return (
        <figure className="m-0">
            <svg
                viewBox={`0 0 ${VIEW_W} ${height}`}
                className="w-full"
                style={{ height }}
                role="img"
                aria-label={`${label}. ${data
                    .map((bucket) => `${bucket.title ?? bucket.label}: ${format(bucket.value)}`)
                    .join('; ')}.`}
            >
                {ticks.map((fraction) => {
                    const y = pad.top + (1 - fraction) * plotH;
                    return (
                        <g key={fraction}>
                            <line
                                x1={pad.left}
                                y1={y}
                                x2={VIEW_W - pad.right}
                                y2={y}
                                stroke="var(--color-steel)"
                                strokeOpacity={0.15}
                                strokeWidth={1}
                            />
                            <text
                                x={pad.left - 6}
                                y={y + 3}
                                textAnchor="end"
                                fontSize={9}
                                fontFamily="var(--font-mono)"
                                fill="var(--color-steel)"
                            >
                                {format(max * fraction)}
                            </text>
                        </g>
                    );
                })}

                {data.map((bucket, index) => {
                    const barH = Math.max((bucket.value / max) * plotH, bucket.value > 0 ? 2 : 0);
                    const x = pad.left + index * step + (step - barW) / 2;
                    const y = pad.top + plotH - barH;
                    return (
                        <g key={bucket.label}>
                            <rect
                                x={x}
                                y={y}
                                width={barW}
                                height={barH}
                                rx={3}
                                fill={bucket.color ?? BRAND}
                            >
                                <title>{`${bucket.title ?? bucket.label}: ${format(bucket.value)}`}</title>
                            </rect>
                            <text
                                x={x + barW / 2}
                                y={height - 16}
                                textAnchor="middle"
                                fontSize={10}
                                fontFamily="var(--font-mono)"
                                fill="var(--color-steel)"
                            >
                                {bucket.label}
                            </text>
                        </g>
                    );
                })}
            </svg>
            <figcaption className="sr-only">{label}</figcaption>
        </figure>
    );
}

// ── Horizontal, directly labelled ───────────────────────────────────────────

export interface RankedBarsProps {
    data: Bucket[];
    label: string;
    /** Scale ceiling. Defaults to the largest value; pass 100 for percentages. */
    max?: number;
    format?: (value: number) => string;
}

/**
 * Ranked bars, one row per bucket, label and value both in text.
 *
 * This replaces the donut the safety view used and the progress bars the
 * maintenance view used. At the counts a control room actually sees — four
 * incident types, one or two each — arc lengths are not comparable by eye and
 * the legend put identity in colour alone. Rows read directly.
 */
export function RankedBars({ data, label, max, format = formatCount }: RankedBarsProps) {
    if (data.length === 0) return <ChartEmpty height={72} />;

    const ceiling = Math.max(max ?? Math.max(...data.map((bucket) => bucket.value)), 1);

    return (
        <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label={label}>
            {data.map((bucket) => (
                <li key={bucket.label} className="grid grid-cols-[1fr_auto] items-baseline gap-x-3">
                    <span className="truncate text-xs text-ice" title={bucket.title ?? bucket.label}>
                        {bucket.label}
                    </span>
                    <span className="tabular text-xs text-steel">{format(bucket.value)}</span>
                    <span
                        className="col-span-2 mt-1 block h-1.5 rounded-full bg-navy-700"
                        aria-hidden="true"
                    >
                        <span
                            className="block h-full rounded-full"
                            style={{
                                width: `${Math.min(100, (bucket.value / ceiling) * 100)}%`,
                                backgroundColor: bucket.color ?? BRAND,
                            }}
                        />
                    </span>
                </li>
            ))}
        </ul>
    );
}

// ── Empty state ─────────────────────────────────────────────────────────────

export function ChartEmpty({ height = 140 }: { height?: number }) {
    return (
        <p className="flex items-center justify-center text-sm text-steel" style={{ height }}>
            Sin datos en el periodo
        </p>
    );
}
