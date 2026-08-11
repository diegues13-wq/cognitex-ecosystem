import type { ReactNode } from 'react';
import { STATUS_COLOR, type Status } from '@cognitex/theme';

/**
 * The console's small parts.
 *
 * `MetricCard` from @cognitex/ui carries the headline figures — the four-wide
 * strips at the top of each view. These are what a CCO needs in addition: a
 * titled panel, a readout dense enough for a 280px rail, and a status pill
 * that always ships a word next to the colour.
 */

export interface PanelProps {
    title?: string;
    /** Right-aligned in the header — counts, selectors. */
    action?: ReactNode;
    className?: string;
    children: ReactNode;
}

export function Panel({ title, action, className = '', children }: PanelProps) {
    return (
        <section className={`occ-panel p-3 ${className}`}>
            {(title || action) && (
                <header className="mb-3 flex min-h-6 items-center justify-between gap-2">
                    {title && <h2 className="label-mono">{title}</h2>}
                    {action}
                </header>
            )}
            {children}
        </section>
    );
}

export interface ReadoutProps {
    label: string;
    value: string;
    unit?: string;
    /** Colours the figure. Omit to leave it in the default ink. */
    status?: Status;
    hint?: string;
}

/**
 * One compact number.
 *
 * Deliberately not 8px type. The old console had drifted to `text-[8px]`
 * labels and `text-[9px]` values, which is unreadable at the metre-plus
 * viewing distance of a wall-mounted control-room display; density here comes
 * from tight spacing at the shared type scale instead.
 */
export function Readout({ label, value, unit, status, hint }: ReadoutProps) {
    return (
        <div className="occ-panel-inset px-2.5 py-2">
            <p className="label-mono truncate" title={label}>
                {label}
            </p>
            <p className="mt-1 flex items-baseline gap-1">
                <span
                    className="tabular text-xl leading-none font-semibold"
                    style={status ? { color: STATUS_COLOR[status] } : undefined}
                    data-metric
                >
                    {value}
                </span>
                {unit && <span className="text-xs text-steel">{unit}</span>}
            </p>
            {hint && <p className="mt-1 truncate text-xs text-steel">{hint}</p>}
        </div>
    );
}

export interface StatusPillProps {
    status: Status;
    children: ReactNode;
    /** Critical states blink; everything else holds steady. */
    blink?: boolean;
}

/**
 * A state indicator that reads without colour vision.
 *
 * Every dot in the old console was colour alone. The word is always present
 * here, and the dot is the redundant channel rather than the only one.
 */
export function StatusPill({ status, children, blink = false }: StatusPillProps) {
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs whitespace-nowrap"
            style={{
                borderColor: `color-mix(in srgb, ${STATUS_COLOR[status]} 35%, transparent)`,
                color: STATUS_COLOR[status],
            }}
        >
            <span
                className={`occ-dot ${blink && status === 'alert' ? 'occ-dot-alert' : ''}`}
                style={{ backgroundColor: STATUS_COLOR[status] }}
                aria-hidden="true"
            />
            {children}
        </span>
    );
}
