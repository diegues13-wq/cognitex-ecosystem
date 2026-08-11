import { StatusDot } from '@cognitex/ui';
import type { Alert } from '@cognitex/data';

import { formatDateTime } from '../format';

/**
 * The alarm feed.
 *
 * Three things the old feed did not do:
 *
 *  · It is a list, marked up as one, announced when it changes. The old one
 *    was a `div` of `div`s keyed by array index, so React reused the wrong
 *    row every time a new alarm arrived at the top.
 *  · Severity is carried by a word as well as a colour. `StatusDot` renders
 *    the label for screen readers; the old feed distinguished CRITICAL from
 *    WARNING by hue alone.
 *  · Acknowledgement exists. An operator can mark that they have seen an
 *    alarm, which is the whole point of an alarm system and which neither the
 *    console nor `cloud/main.py` offered.
 */

export interface AlertFeedProps {
    alerts: readonly Alert[];
    /** Null when acknowledgement is not offered — a historical view. */
    onAcknowledge: ((alert: Alert) => void) | null;
    /** Says whether the acknowledgement will be persisted. */
    persisted: boolean;
}

export function AlertFeed({ alerts, onAcknowledge, persisted }: AlertFeedProps) {
    if (alerts.length === 0) {
        return (
            <p className="py-6 text-center text-sm text-steel" role="status">
                Sin alarmas en el periodo. Todos los canales dentro de límites.
            </p>
        );
    }

    return (
        <ul className="space-y-2" aria-label="Alarmas del periodo">
            {alerts.map((alert) => (
                <li
                    key={alert.id}
                    className="panel-raised flex flex-wrap items-center justify-between gap-3 p-3"
                >
                    <div className="flex min-w-0 items-start gap-2.5">
                        <span className="mt-1">
                            <StatusDot status={alert.status} />
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm text-ice">{alert.message}</p>
                            <p className="mt-0.5 text-xs text-steel">
                                <time dateTime={new Date(alert.at).toISOString()}>
                                    {formatDateTime(alert.at)}
                                </time>
                                {alert.acknowledgedAt !== null && (
                                    <>
                                        {' · '}
                                        <span>
                                            Reconocida {formatDateTime(alert.acknowledgedAt)}
                                        </span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {onAcknowledge && alert.acknowledgedAt === null && (
                        <button
                            type="button"
                            onClick={() => onAcknowledge(alert)}
                            className="min-h-9 shrink-0 rounded-lg border border-steel/25 px-3 text-xs text-steel transition-colors hover:bg-navy-700 hover:text-ice"
                        >
                            Reconocer
                            <span className="sr-only">
                                {' '}
                                la alarma {alert.message}
                                {persisted ? '' : ' (solo en esta sesión)'}
                            </span>
                        </button>
                    )}
                </li>
            ))}
        </ul>
    );
}
