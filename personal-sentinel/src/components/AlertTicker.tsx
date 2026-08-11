import { useState } from 'react';
import { STATUS_COLOR } from '@cognitex/theme';
import type { Alert } from '@cognitex/data';

import { shortStamp } from '../domain';

/**
 * The crew's active alarms, across the top of every section.
 *
 * `role="alert"` and an assertive live region, because a man-down alarm is the
 * one thing on this screen a supervisor must not have to be looking at to
 * notice. The panel it replaces was a scrolling list in the corner of one tab,
 * with the severity carried entirely by colour.
 */

export interface AlertTickerProps {
    alerts: readonly Alert[];
}

export function AlertTicker({ alerts }: AlertTickerProps) {
    const [dismissed, setDismissed] = useState(false);

    if (alerts.length === 0 || dismissed) return null;

    const worst = alerts.find((alert) => alert.status === 'alert') ?? alerts[0]!;

    return (
        <div
            role="alert"
            aria-live="assertive"
            className="flex flex-wrap items-center gap-3 border-b border-steel/15 bg-navy-800 px-4 py-2.5"
        >
            <span
                className="inline-block size-2 shrink-0 rounded-full"
                style={{ backgroundColor: STATUS_COLOR[worst.status] }}
                aria-hidden="true"
            />
            <p className="min-w-0 flex-1 text-sm text-ice">
                <span className="label-mono mr-2">{shortStamp(worst.at)}</span>
                {worst.message}
            </p>

            {alerts.length > 1 && <span className="label-mono">+{alerts.length - 1} más</span>}

            <button
                type="button"
                onClick={() => setDismissed(true)}
                aria-label="Ocultar la barra de alarmas"
                className="flex size-11 items-center justify-center rounded-lg text-steel hover:text-ice"
            >
                <svg
                    viewBox="0 0 24 24"
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                >
                    <path d="M6 6l12 12M18 6L6 18" />
                </svg>
            </button>
        </div>
    );
}
