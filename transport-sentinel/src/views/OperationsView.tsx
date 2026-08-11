import { useMemo } from 'react';
import type { Metric } from '@cognitex/data';
import { MetricCard, TimeSeriesChart } from '@cognitex/ui';

import type { FleetKpis, HistoryDay, RailRoute, TrainSnapshot } from '../domain/types';
import { ON_TIME_LIMIT_MIN, SERVICE_KIND_LABEL, targetStatus } from '../domain/status';
import { dayToMillis, toSeries } from '../domain/series';
import { BarChart, type Bucket } from '../components/Charts';
import { Panel } from '../components/Panel';

/**
 * Punctuality and production.
 *
 * Everything on this screen is now computed from the fleet snapshot or the
 * daily history. The previous version showed four headline figures of which
 * three were string literals — "4.2 min", "0 cancelados", "98.4 %" — and a
 * per-route table whose OTP came from `route.id.charCodeAt(…) % 23`. Numbers
 * that cannot move are worse than no numbers: an operator trusts them.
 */

const DELAY_BANDS: { label: string; title: string; test: (delay: number) => boolean; color: string }[] =
    [
        {
            label: '≤3 min',
            title: 'Servicios dentro del umbral de puntualidad',
            test: (delay) => delay <= ON_TIME_LIMIT_MIN,
            color: 'var(--color-ok)',
        },
        {
            label: '4–10',
            title: 'Retraso leve, entre 4 y 10 minutos',
            test: (delay) => delay > ON_TIME_LIMIT_MIN && delay <= 10,
            color: 'var(--color-warn)',
        },
        {
            label: '11–20',
            title: 'Retraso relevante, entre 11 y 20 minutos',
            test: (delay) => delay > 10 && delay <= 20,
            color: 'var(--color-warn)',
        },
        {
            label: '>20',
            title: 'Retraso grave, más de 20 minutos',
            test: (delay) => delay > 20,
            color: 'var(--color-alert)',
        },
    ];

export interface OperationsViewProps {
    history: HistoryDay[];
    kpis: FleetKpis;
    routes: RailRoute[];
    snapshot: TrainSnapshot[];
}

export default function OperationsView({ history, kpis, routes, snapshot }: OperationsViewProps) {
    const running = useMemo(
        () => snapshot.filter((train) => train.status === 'EN_SERVICIO'),
        [snapshot]
    );

    const meanDelay =
        running.length === 0
            ? 0
            : running.reduce((total, train) => total + Math.max(0, train.delayMin), 0) /
              running.length;

    const metrics: Metric[] = [
        {
            id: 'otp',
            label: 'OTP global',
            value: kpis.otp,
            unit: '%',
            precision: 0,
            status: targetStatus(kpis.otp, 85),
            trend: null,
        },
        {
            id: 'delay',
            label: 'Retraso medio en ruta',
            value: meanDelay,
            unit: 'min',
            precision: 1,
            status: meanDelay <= ON_TIME_LIMIT_MIN ? 'ok' : meanDelay <= 8 ? 'warning' : 'alert',
            trend: null,
        },
        {
            id: 'running',
            label: 'Trenes en servicio',
            value: kpis.trenesActivos,
            unit: `de ${kpis.total}`,
            precision: 0,
            status: kpis.trenesActivos > 0 ? 'ok' : 'alert',
            trend: null,
        },
        {
            id: 'km',
            label: 'Kilómetros hoy',
            value: kpis.kmTotales,
            unit: 'km',
            precision: 0,
            status: 'ok',
            trend: null,
        },
    ];

    const delayBands: Bucket[] = useMemo(
        () =>
            DELAY_BANDS.map((band) => ({
                label: band.label,
                title: band.title,
                color: band.color,
                value: running.filter((train) => band.test(Math.max(0, train.delayMin))).length,
            })),
        [running]
    );

    const punctuality = useMemo(
        () => toSeries(history, (day) => dayToMillis(day.date), (day) => day.otp),
        [history]
    );

    const production = useMemo(
        () => toSeries(history, (day) => dayToMillis(day.date), (day) => day.kmTraveled),
        [history]
    );

    /**
     * Per-route performance, aggregated from the trains actually assigned to
     * each route right now. A route with nothing running is reported as such
     * rather than given an invented score.
     */
    const routePerformance = useMemo(() => {
        return routes
            .map((route) => {
                const assigned = snapshot.filter((train) => train.route === route.id);
                const active = assigned.filter((train) => train.status === 'EN_SERVICIO');
                const onTime = active.filter(
                    (train) => train.delayMin <= ON_TIME_LIMIT_MIN
                ).length;
                return {
                    id: route.id,
                    name: route.name,
                    type: route.type,
                    assigned: assigned.length,
                    active: active.length,
                    otp: active.length === 0 ? null : Math.round((onTime / active.length) * 100),
                    meanDelay:
                        active.length === 0
                            ? null
                            : active.reduce(
                                  (total, train) => total + Math.max(0, train.delayMin),
                                  0
                              ) / active.length,
                };
            })
            .sort((a, b) => (b.otp ?? -1) - (a.otp ?? -1));
    }, [routes, snapshot]);

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                    <MetricCard key={metric.id} metric={metric} />
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Tendencia de puntualidad — 30 días">
                    <TimeSeriesChart
                        points={punctuality}
                        label="OTP diario de la red"
                        unit="%"
                        height={190}
                        band={{ low: 85, high: 100 }}
                    />
                    <p className="mt-2 text-xs text-steel">
                        La banda marca el objetivo: 85 % o más de servicios dentro de los{' '}
                        {ON_TIME_LIMIT_MIN} minutos.
                    </p>
                </Panel>

                <Panel title="Distribución de retrasos ahora mismo">
                    <BarChart
                        data={delayBands}
                        label={`Trenes en servicio por banda de retraso, sobre ${running.length} en ruta`}
                        height={190}
                    />
                </Panel>

                <Panel title="Kilómetros recorridos — 30 días">
                    <TimeSeriesChart
                        points={production}
                        label="Kilómetros diarios"
                        unit="km"
                        height={190}
                    />
                </Panel>

                <Panel title="Rendimiento por ruta">
                    <div className="overflow-x-auto">
                        <table className="occ-table">
                            <thead>
                                <tr>
                                    <th scope="col">Ruta</th>
                                    <th scope="col" className="num">
                                        En ruta
                                    </th>
                                    <th scope="col" className="num">
                                        OTP
                                    </th>
                                    <th scope="col" className="num">
                                        Retraso medio
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {routePerformance.map((route) => (
                                    <tr key={route.id}>
                                        <td>
                                            <span className="block text-ice">{route.name}</span>
                                            <span className="block text-xs text-steel">
                                                {SERVICE_KIND_LABEL[route.type]}
                                            </span>
                                        </td>
                                        <td className="num tabular">
                                            {route.active}/{route.assigned}
                                        </td>
                                        <td
                                            className="num tabular"
                                            style={
                                                route.otp === null
                                                    ? undefined
                                                    : {
                                                          color:
                                                              route.otp >= 85
                                                                  ? 'var(--color-ok)'
                                                                  : 'var(--color-warn)',
                                                      }
                                            }
                                        >
                                            {route.otp === null ? '—' : `${route.otp} %`}
                                        </td>
                                        <td className="num tabular">
                                            {route.meanDelay === null
                                                ? '—'
                                                : `${route.meanDelay.toFixed(1)} min`}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-2 text-xs text-steel">
                        «—» significa que ninguna unidad de esa ruta está en servicio en este
                        momento.
                    </p>
                </Panel>
            </div>
        </div>
    );
}
