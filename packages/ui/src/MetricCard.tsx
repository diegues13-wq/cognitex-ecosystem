import { STATUS_COLOR, type Status } from '@cognitex/theme';
import type { Metric } from '@cognitex/data';

/**
 * One reading on a dashboard.
 *
 * Replaces four separate KPI card implementations. It also fixes a bug all of
 * them shared: they rendered `value || '--'`, so a legitimate zero — an
 * off-shift OEE, a fleet with no delay, zero open constraints — displayed as
 * "no data". Zero is a measurement, and often the one you want to see.
 */

export interface MetricCardProps {
    metric: Metric;
    /** Shown when the figure came from a generator rather than the database. */
    generated?: boolean;
    /**
     * Which direction counts as improvement.
     *
     * Without this the card coloured every rise green, so a temperature or a
     * vibration climbing toward its alarm limit read as good news — the
     * opposite of what the operator needed to see. Defaults to `up` because
     * that is right for OEE, availability and compliance; pass `down` for
     * anything you want to fall, and `none` when a change has no valence.
     */
    trendDirection?: 'up' | 'down' | 'none';
}

function formatTrend(trend: number): string {
    const sign = trend > 0 ? '+' : '';
    return `${sign}${(trend * 100).toFixed(1)}%`;
}

export function MetricCard({
    metric,
    generated = false,
    trendDirection = 'up',
}: MetricCardProps) {
    const { label, value, unit, precision, status, trend } = metric;

    const trendColor = (change: number): string => {
        if (trendDirection === 'none' || change === 0) return 'var(--color-steel)';
        const improving = trendDirection === 'up' ? change > 0 : change < 0;
        return improving ? 'var(--color-ok)' : 'var(--color-alert)';
    };

    return (
        <article className="panel p-4">
            <div className="flex items-start justify-between gap-2">
                <h3 className="label-mono">{label}</h3>
                <StatusDot status={status} />
            </div>

            <p className="mt-3 flex items-baseline gap-1.5">
                {/* Number.isFinite, not a truthiness check: 0 is a value. */}
                <span
                    className="text-[length:var(--text-metric)] leading-none font-semibold tabular"
                    data-metric
                >
                    {Number.isFinite(value) ? value.toFixed(precision) : '—'}
                </span>
                {unit && <span className="text-sm text-steel">{unit}</span>}
            </p>

            <div className="mt-2 flex items-center gap-2 text-xs">
                {trend !== null && Number.isFinite(trend) && (
                    <span className="tabular" style={{ color: trendColor(trend) }}>
                        {formatTrend(trend)}
                    </span>
                )}
                {generated && <span className="text-steel/70">simulado</span>}
            </div>
        </article>
    );
}

export interface StatusDotProps {
    status: Status;
    label?: string;
}

/**
 * Status indicator.
 *
 * Carries a text label for screen readers rather than relying on colour
 * alone — every platform previously signalled state with a bare coloured dot,
 * which is invisible to anyone who cannot distinguish the hues.
 */
export function StatusDot({ status, label }: StatusDotProps) {
    const text = label ?? STATUS_TEXT[status];

    return (
        <span className="inline-flex items-center gap-1.5">
            <span
                className="inline-block size-2 shrink-0 rounded-full"
                style={{ backgroundColor: STATUS_COLOR[status] }}
                aria-hidden="true"
            />
            <span className="sr-only">{text}</span>
        </span>
    );
}

const STATUS_TEXT: Record<Status, string> = {
    ok: 'Normal',
    warning: 'Advertencia',
    alert: 'Alerta',
    offline: 'Sin señal',
};
