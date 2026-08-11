import { useMemo } from 'react';
import type { Metric } from '@cognitex/data';
import { MetricCard } from '@cognitex/ui';
import { Brain } from 'lucide-react';

import type { FleetKpis, RamsMetric, WorkOrder } from '../domain/types';
import { ceilingStatus, targetStatus } from '../domain/status';
import { BarChart, RankedBars, type Bucket } from '../components/Charts';
import { Panel, StatusPill } from '../components/Panel';
import { WorkOrderCard } from '../components/WorkOrderCard';

/**
 * CMMS and RAMS. The maintenance board a depot planner works from, plus the
 * EN 50126 figures the contract is measured on.
 */

/** Below this, a component is close enough to end-of-life to plan around. */
const CRITICAL_LIFE_PCT = 15;

const TYPE_LABEL = {
    PREVENTIVO: 'Preventivo',
    CORRECTIVO: 'Correctivo',
    PREDICTIVO: 'Predictivo',
    INSPECCION: 'Inspección',
} as const;

export interface MaintenanceViewProps {
    orders: WorkOrder[];
    rams: RamsMetric[];
    kpis: FleetKpis;
}

export default function MaintenanceView({ orders, rams, kpis }: MaintenanceViewProps) {
    const open = orders.filter((order) => order.status !== 'COMPLETADO');
    const done = orders.filter((order) => order.status === 'COMPLETADO');
    const inProgress = orders.filter((order) => order.status === 'EN_CURSO');

    const predicted = orders.filter(
        (order) =>
            order.aiPredictedFailureDate !== null &&
            order.remainingLifePct !== null &&
            order.remainingLifePct <= CRITICAL_LIFE_PCT
    );

    const metrics: Metric[] = [
        {
            id: 'mtbf',
            label: 'MTBF',
            value: kpis.mtbf,
            unit: 'h',
            precision: 0,
            status: targetStatus(kpis.mtbf, 2800),
            trend: null,
        },
        {
            id: 'mttr',
            label: 'MTTR',
            value: kpis.mttr,
            unit: 'h',
            precision: 1,
            status: ceilingStatus(kpis.mttr, 4),
            trend: null,
        },
        {
            id: 'availability',
            label: 'Disponibilidad',
            value: kpis.ramsDisponibilidad,
            unit: '%',
            precision: 1,
            status: targetStatus(kpis.ramsDisponibilidad, 90),
            trend: null,
        },
        {
            id: 'compliance',
            label: 'Cumplimiento preventivo',
            value: kpis.prevMaintCompliance,
            unit: '%',
            precision: 0,
            status: targetStatus(kpis.prevMaintCompliance, 95),
            trend: null,
        },
    ];

    const byType: Bucket[] = useMemo(() => {
        const tally = new Map<WorkOrder['type'], number>();
        for (const order of orders) tally.set(order.type, (tally.get(order.type) ?? 0) + 1);
        return (Object.keys(TYPE_LABEL) as (keyof typeof TYPE_LABEL)[]).map((type) => ({
            label: TYPE_LABEL[type],
            title: `Órdenes de tipo ${TYPE_LABEL[type].toLowerCase()}`,
            value: tally.get(type) ?? 0,
        }));
    }, [orders]);

    const componentLife: Bucket[] = useMemo(
        () =>
            orders
                .filter((order) => order.remainingLifePct !== null)
                .sort((a, b) => (a.remainingLifePct ?? 0) - (b.remainingLifePct ?? 0))
                .slice(0, 5)
                .map((order) => ({
                    label: order.component,
                    title: `${order.assetId} · ${order.component}`,
                    value: order.remainingLifePct ?? 0,
                    color:
                        (order.remainingLifePct ?? 0) <= CRITICAL_LIFE_PCT
                            ? 'var(--color-alert)'
                            : (order.remainingLifePct ?? 0) <= 40
                              ? 'var(--color-warn)'
                              : 'var(--color-brand)',
                })),
        [orders]
    );

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                    <MetricCard key={metric.id} metric={metric} />
                ))}
            </div>

            <div className="flex flex-wrap gap-2">
                <StatusPill status="offline">
                    {orders.length - inProgress.length - done.length} pendientes
                </StatusPill>
                <StatusPill status="warning">{inProgress.length} en curso</StatusPill>
                <StatusPill status="ok">{done.length} completadas</StatusPill>
                {predicted.length > 0 && (
                    <StatusPill status="alert" blink>
                        {predicted.length} con fallo previsto
                    </StatusPill>
                )}
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="flex flex-col gap-4">
                    {predicted.length > 0 && (
                        <Panel title="Predicción de fallo">
                            <ul className="m-0 flex list-none flex-col gap-2 p-0">
                                {predicted.map((order) => (
                                    <li
                                        key={order.id}
                                        className="flex items-start gap-2 text-sm text-ice"
                                    >
                                        <Brain
                                            size={14}
                                            aria-hidden="true"
                                            className="mt-0.5 shrink-0"
                                            style={{ color: 'var(--color-alert)' }}
                                        />
                                        <span>
                                            <span className="font-mono">{order.assetId}</span> —{' '}
                                            {order.component}: fallo previsto{' '}
                                            {order.aiPredictedFailureDate}
                                            {order.aiConfidencePct !== null &&
                                                ` (confianza ${order.aiConfidencePct} %)`}
                                            . Vida útil restante{' '}
                                            <span className="tabular">
                                                {order.remainingLifePct} %
                                            </span>
                                            .
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    )}

                    <section>
                        <h2 className="label-mono mb-2">Órdenes abiertas ({open.length})</h2>
                        {open.length === 0 ? (
                            <Panel>
                                <p className="text-sm text-steel">
                                    Sin órdenes abiertas en la flota.
                                </p>
                            </Panel>
                        ) : (
                            <div className="grid gap-2 md:grid-cols-2">
                                {open.map((order) => (
                                    <WorkOrderCard key={order.id} order={order} />
                                ))}
                            </div>
                        )}
                    </section>

                    {done.length > 0 && (
                        <section>
                            <h2 className="label-mono mb-2">Completadas ({done.length})</h2>
                            <div className="grid gap-2 md:grid-cols-2">
                                {done.map((order) => (
                                    <WorkOrderCard key={order.id} order={order} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    <Panel title="Órdenes por tipo">
                        <BarChart data={byType} label="Órdenes de trabajo por tipo" height={150} />
                    </Panel>

                    {componentLife.length > 0 && (
                        <Panel title="Vida útil restante">
                            <RankedBars
                                data={componentLife}
                                label="Componentes con menor vida útil restante"
                                max={100}
                                format={(value) => `${Math.round(value)} %`}
                            />
                        </Panel>
                    )}

                    <Panel title="RAMS por activo">
                        <div className="overflow-x-auto">
                            <table className="occ-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Tren</th>
                                        <th scope="col" className="num">
                                            MTBF
                                        </th>
                                        <th scope="col" className="num">
                                            Disp.
                                        </th>
                                        <th scope="col" className="num">
                                            Salud
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rams.slice(0, 10).map((metric) => (
                                        <tr key={metric.trainId}>
                                            <td className="font-mono">{metric.trainId}</td>
                                            <td className="num tabular">
                                                {metric.mtbf.toLocaleString('es-EC')} h
                                            </td>
                                            <td
                                                className="num tabular"
                                                style={{
                                                    color:
                                                        metric.availability >= 90
                                                            ? 'var(--color-ok)'
                                                            : 'var(--color-warn)',
                                                }}
                                            >
                                                {metric.availability} %
                                            </td>
                                            <td className="num tabular">{metric.healthScore}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Panel>
                </div>
            </div>
        </div>
    );
}
