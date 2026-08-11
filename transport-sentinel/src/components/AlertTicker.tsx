import { STATUS_COLOR } from '@cognitex/theme';
import { AlertTriangle, Clock, Fuel, Info, Users, Wrench, Zap } from 'lucide-react';
import type { ComponentType } from 'react';

import type { AlertCategory, RailAlert } from '../domain/types';
import { formatClock } from '../domain/status';

/**
 * The CCO strip.
 *
 * This is the component the `{time, priority}` versus `{timestamp, severity}`
 * mismatch hit hardest: it rendered `alert.time`, the client-side generator
 * never wrote that field, and the result was a scrolling row of messages with
 * no timestamps at all. It reads the shared `Alert` now, so the time is an
 * instant and gets formatted here rather than arriving pre-formatted from
 * whichever producer answered.
 */

const CATEGORY_ICON: Record<AlertCategory, ComponentType<{ size?: number }>> = {
    MANTENIMIENTO: Wrench,
    PREDICTIVO: Zap,
    RETRASO: Clock,
    OCUPACION: Users,
    ENERGIA: Zap,
    COMBUSTIBLE: Fuel,
    INFO: Info,
};

const CATEGORY_LABEL: Record<AlertCategory, string> = {
    MANTENIMIENTO: 'Mantenimiento',
    PREDICTIVO: 'Predictivo',
    RETRASO: 'Retraso',
    OCUPACION: 'Ocupación',
    ENERGIA: 'Energía',
    COMBUSTIBLE: 'Combustible',
    INFO: 'Información',
};

export interface AlertTickerProps {
    alerts: RailAlert[];
}

export function AlertTicker({ alerts }: AlertTickerProps) {
    if (alerts.length === 0) return null;

    // One duplicate copy makes the -50% keyframe loop seamlessly.
    const track = [...alerts, ...alerts];

    return (
        <div className="flex min-h-9 items-center overflow-hidden border-b border-steel/15 bg-navy-deep">
            <p className="flex shrink-0 items-center gap-1.5 self-stretch border-r border-steel/15 px-3">
                <AlertTriangle size={13} style={{ color: 'var(--color-warn)' }} aria-hidden="true" />
                <span className="label-mono">CCO</span>
            </p>

            {/*
             * The list is announced once, not twice, and not on every loop:
             * a marquee that re-announces itself is unusable with a screen
             * reader. The duplicate copy is hidden from the accessibility tree.
             */}
            <div className="relative flex-1 overflow-hidden">
                <div className="occ-ticker-track flex w-max gap-8 py-1.5 whitespace-nowrap">
                    {track.map((alert, index) => {
                        const Icon = CATEGORY_ICON[alert.category];
                        const duplicate = index >= alerts.length;
                        return (
                            <span
                                key={`${alert.id}-${index}`}
                                className="inline-flex items-center gap-2 text-xs"
                                aria-hidden={duplicate ? 'true' : undefined}
                            >
                                <span
                                    className="inline-flex items-center gap-1"
                                    style={{ color: STATUS_COLOR[alert.status] }}
                                >
                                    <Icon size={12} />
                                    {CATEGORY_LABEL[alert.category]}
                                </span>
                                <span className="tabular text-steel">{formatClock(alert.at)}</span>
                                {alert.assetId && (
                                    <span className="font-mono" style={{ color: 'var(--color-brand)' }}>
                                        {alert.assetId}
                                    </span>
                                )}
                                <span className="text-ice">{alert.message}</span>
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
