import { useEffect, useMemo, useState } from 'react';
import { STATUS_COLOR, STATUS_RANK } from '@cognitex/theme';

import * as api from '../services/api';
import type {
    FleetKpis,
    Incident,
    RailAlert,
    RailRoute,
    Schedule,
    TrainSnapshot,
    TrainStatus,
} from '../domain/types';
import {
    ON_TIME_LIMIT_MIN,
    TRAIN_STATUS,
    TRAIN_STATUS_LABEL,
    formatClock,
    targetStatus,
} from '../domain/status';
import { Panel, Readout, StatusPill } from '../components/Panel';
import { TrainGraph } from '../components/TrainGraph';
import { TrainMap } from '../components/TrainMap';

/**
 * The control centre: where every train is, what is running late, what needs
 * a decision in the next few minutes.
 */

const TRACKED_STATUSES: TrainStatus[] = ['EN_SERVICIO', 'EN_MANTENIMIENTO', 'STANDBY'];

export interface CCOViewProps {
    snapshot: TrainSnapshot[];
    alerts: RailAlert[];
    kpis: FleetKpis;
    incidents: Incident[];
    routes: RailRoute[];
    /** The instant the snapshot was taken; see `CoreData.at`. */
    now: number;
}

/**
 * The schedule, tagged with the route it belongs to.
 *
 * Keeping the route id alongside the answer means "still loading" is derived
 * — the stored route is not yet the selected one — rather than a second piece
 * of state that has to be flipped on at the top of an effect. It also removes
 * the frame where the previous route's diagram was shown under the new
 * route's name.
 */
interface ScheduleResult {
    routeId: string;
    schedule: Schedule | null;
}

export default function CCOView({
    snapshot,
    alerts,
    kpis,
    incidents,
    routes,
    now,
}: CCOViewProps) {
    const [routeId, setRouteId] = useState('RT-001');
    const [result, setResult] = useState<ScheduleResult | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        api.fetchSchedule(routeId, controller.signal)
            .then((schedule) => setResult({ routeId, schedule }))
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === 'AbortError') return;
                console.error('[CCO] horario:', error);
                setResult({ routeId, schedule: null });
            });
        return () => controller.abort();
    }, [routeId]);

    const loadingSchedule = result?.routeId !== routeId;
    const schedule = loadingSchedule ? null : (result?.schedule ?? null);

    const counts = useMemo(() => {
        const tally = new Map<TrainStatus, number>();
        for (const train of snapshot) {
            tally.set(train.status, (tally.get(train.status) ?? 0) + 1);
        }
        return tally;
    }, [snapshot]);

    /**
     * Open incidents, counted.
     *
     * This line used to be `const openIncidents = 1;` with a comment naming
     * the incident it stood for — so the control room's incident indicator
     * was a constant that could not go to zero when the incident was closed,
     * and could not go to two when a second one opened.
     */
    const openIncidents = incidents.filter((incident) => incident.status === 'ABIERTO');

    // Sorted by severity, then most recent. The old filter compared against a
    // `priority` field the client-side producer never wrote, so the "critical"
    // count read zero during an actual critical alert.
    const ranked = useMemo(
        () =>
            [...alerts].sort(
                (a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status] || b.at - a.at
            ),
        [alerts]
    );
    const criticalCount = ranked.filter((alert) => alert.status === 'alert').length;

    const running = snapshot.filter((train) => train.status === 'EN_SERVICIO');
    const nextDepartures = running
        .slice()
        .sort((a, b) => b.delayMin - a.delayMin)
        .slice(0, 6);

    const passengerRoutes = routes.filter((route) => route.type !== 'carga');

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
                <h2 className="label-mono">Estado de flota</h2>
                {TRACKED_STATUSES.map((status) => (
                    <StatusPill key={status} status={TRAIN_STATUS[status]}>
                        <span className="tabular font-medium">{counts.get(status) ?? 0}</span>
                        <span className="text-steel">{TRAIN_STATUS_LABEL[status]}</span>
                    </StatusPill>
                ))}
                <span className="ml-auto">
                    <StatusPill status={openIncidents.length > 0 ? 'alert' : 'ok'} blink>
                        {openIncidents.length > 0
                            ? `${openIncidents.length} incidente${openIncidents.length > 1 ? 's' : ''} abierto${openIncidents.length > 1 ? 's' : ''}`
                            : 'Sin incidentes abiertos'}
                    </StatusPill>
                </span>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="flex flex-col gap-4">
                    <div className="h-[22rem] sm:h-[26rem]">
                        <TrainMap trains={snapshot} routes={routes} />
                    </div>

                    <Panel
                        title="Gráfico tiempo–distancia"
                        action={
                            <label className="flex items-center gap-2 text-xs text-steel">
                                <span className="sr-only sm:not-sr-only">Ruta</span>
                                <select
                                    value={routeId}
                                    onChange={(event) => setRouteId(event.target.value)}
                                    className="min-h-9 rounded-lg border border-steel/25 bg-navy-900 px-2 text-xs text-ice"
                                >
                                    {passengerRoutes.map((route) => (
                                        <option key={route.id} value={route.id}>
                                            {route.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        }
                    >
                        {loadingSchedule ? (
                            <p className="flex h-40 items-center justify-center" role="status">
                                <span className="label-mono">Cargando horario…</span>
                            </p>
                        ) : (
                            <TrainGraph schedule={schedule} now={now} />
                        )}
                    </Panel>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-2">
                        <Readout
                            label="OTP"
                            value={`${kpis.otp}`}
                            unit="%"
                            status={targetStatus(kpis.otp, 85)}
                        />
                        <Readout
                            label="Disponibilidad"
                            value={`${kpis.ramsDisponibilidad}`}
                            unit="%"
                            status={targetStatus(kpis.ramsDisponibilidad, 90)}
                        />
                        <Readout
                            label="Km hoy"
                            value={kpis.kmTotales.toLocaleString('es-EC')}
                        />
                        <Readout
                            label="Incidentes hoy"
                            value={`${kpis.incidentesHoy}`}
                            status={kpis.incidentesHoy === 0 ? 'ok' : 'alert'}
                        />
                    </div>

                    <Panel
                        title="Alertas activas"
                        action={
                            <StatusPill status={criticalCount > 0 ? 'alert' : 'ok'}>
                                {criticalCount} críticas
                            </StatusPill>
                        }
                    >
                        {ranked.length === 0 ? (
                            <p className="text-sm text-steel">Sin alertas activas.</p>
                        ) : (
                            <ul className="m-0 flex list-none flex-col gap-2 p-0">
                                {ranked.slice(0, 6).map((alert) => (
                                    <li
                                        key={alert.id}
                                        className="occ-panel-inset border-l-2 p-2"
                                        style={{ borderLeftColor: STATUS_COLOR[alert.status] }}
                                    >
                                        <p className="flex items-center gap-2 text-xs text-steel">
                                            <span className="tabular">{formatClock(alert.at)}</span>
                                            {alert.assetId && (
                                                <span
                                                    className="font-mono"
                                                    style={{ color: 'var(--color-brand)' }}
                                                >
                                                    {alert.assetId}
                                                </span>
                                            )}
                                        </p>
                                        <p className="mt-1 text-sm text-ice">{alert.message}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>

                    <Panel title="Trenes en ruta">
                        {nextDepartures.length === 0 ? (
                            <p className="text-sm text-steel">Ningún tren en servicio ahora.</p>
                        ) : (
                            <table className="occ-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Tren</th>
                                        <th scope="col" className="num">
                                            Vel.
                                        </th>
                                        <th scope="col" className="num">
                                            Retraso
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {nextDepartures.map((train) => (
                                        <tr key={train.id}>
                                            <td>
                                                <span className="block truncate text-ice">
                                                    {train.name}
                                                </span>
                                                <span className="block truncate text-xs text-steel">
                                                    {train.routeName}
                                                </span>
                                            </td>
                                            <td className="num tabular">{train.speed}</td>
                                            <td
                                                className="num tabular"
                                                style={{
                                                    color:
                                                        train.delayMin > ON_TIME_LIMIT_MIN
                                                            ? 'var(--color-warn)'
                                                            : 'var(--color-ok)',
                                                }}
                                            >
                                                {train.delayMin > 0
                                                    ? `+${train.delayMin}′`
                                                    : 'A tiempo'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </Panel>
                </div>
            </div>
        </div>
    );
}
