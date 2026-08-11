import { Brain, CheckCircle, Clock, TriangleAlert, Wrench } from 'lucide-react';
import type { ComponentType } from 'react';

import type { WorkOrder, WorkOrderStatus } from '../domain/types';
import {
    WORK_ORDER_PRIORITY,
    WORK_ORDER_STATUS,
    WORK_ORDER_STATUS_LABEL,
} from '../domain/status';
import { StatusPill } from './Panel';

/**
 * One CMMS work order.
 *
 * The icon table below is the one that broke: it knew `EN_CURSO`, the other
 * producer wrote `EN_PROGRESO`, and the lookup fell through to PENDIENTE — so
 * an order a technician was actively working showed the "not started" clock.
 * `WorkOrderStatus` is a closed union now and this record must cover every
 * member of it, so the next spelling is a build error rather than a wrong icon.
 */
const STATUS_ICON: Record<WorkOrderStatus, ComponentType<{ size?: number }>> = {
    PENDIENTE: Clock,
    EN_CURSO: Wrench,
    COMPLETADO: CheckCircle,
    VENCIDO: TriangleAlert,
};

const TYPE_LABEL = {
    PREVENTIVO: 'Preventivo',
    CORRECTIVO: 'Correctivo',
    PREDICTIVO: 'Predictivo',
    INSPECCION: 'Inspección',
} as const;

export interface WorkOrderCardProps {
    order: WorkOrder;
}

export function WorkOrderCard({ order }: WorkOrderCardProps) {
    const StatusIcon = STATUS_ICON[order.status];

    // Only a kilometre trigger has a meaningful progress reading; a
    // time- or condition-based order has nothing to fill.
    const progress =
        order.triggerType === 'KM' && order.triggerValue && order.currentValue !== null
            ? Math.min(100, Math.round((order.currentValue / order.triggerValue) * 100))
            : null;

    return (
        <article className="occ-panel flex flex-col gap-2 p-3">
            <header className="flex items-start justify-between gap-2">
                <span className="flex items-center gap-2">
                    <StatusIcon size={14} aria-hidden="true" />
                    <span className="font-mono text-sm font-medium text-ice">{order.id}</span>
                </span>
                <StatusPill status={WORK_ORDER_STATUS[order.status]}>
                    {WORK_ORDER_STATUS_LABEL[order.status]}
                </StatusPill>
            </header>

            <div>
                <p className="text-sm text-ice">{order.component}</p>
                <p className="mt-0.5 font-mono text-xs text-steel">
                    {order.assetId} · {order.depot}
                </p>
            </div>

            <p className="flex flex-wrap items-center gap-2">
                <StatusPill status={WORK_ORDER_PRIORITY[order.priority]}>
                    Prioridad {order.priority.toLowerCase()}
                </StatusPill>
                <span className="rounded-full border border-steel/25 px-2 py-0.5 text-xs text-steel">
                    {TYPE_LABEL[order.type]}
                </span>
            </p>

            {progress !== null && order.triggerValue !== null && order.currentValue !== null && (
                <div>
                    <p className="flex justify-between text-xs text-steel">
                        <span>
                            {order.currentValue.toLocaleString('es-EC')} /{' '}
                            {order.triggerValue.toLocaleString('es-EC')} km
                        </span>
                        <span className="tabular">{progress}%</span>
                    </p>
                    <span
                        className="mt-1 block h-1.5 rounded-full bg-navy-700"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Avance hacia el disparo de ${order.id}`}
                    >
                        <span
                            className="block h-full rounded-full"
                            style={{
                                width: `${progress}%`,
                                backgroundColor:
                                    progress >= 95
                                        ? 'var(--color-alert)'
                                        : progress >= 85
                                          ? 'var(--color-warn)'
                                          : 'var(--color-brand)',
                            }}
                        />
                    </span>
                    {order.remainingLifePct !== null && (
                        <p className="mt-1 text-xs text-steel">
                            Vida útil restante:{' '}
                            <span className="tabular">{order.remainingLifePct}%</span>
                        </p>
                    )}
                </div>
            )}

            <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-steel">
                <span>Programada: {order.scheduledDate}</span>
                {order.aiPredictedFailureDate && (
                    <span className="flex items-center gap-1">
                        <Brain size={11} aria-hidden="true" />
                        Fallo previsto {order.aiPredictedFailureDate}
                        {order.aiConfidencePct !== null && ` · ${order.aiConfidencePct}% conf.`}
                    </span>
                )}
            </footer>
        </article>
    );
}
