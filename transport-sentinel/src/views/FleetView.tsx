import { useEffect, useMemo, useState } from 'react';
import { TimeSeriesChart } from '@cognitex/ui';

import * as api from '../services/api';
import type { HistoryDay, TrainSnapshot, TrainStatus } from '../domain/types';
import {
    MAINT_URGENCY,
    MAINT_URGENCY_LABEL,
    SERVICE_KIND_LABEL,
    TRACTION_LABEL,
    TRAIN_STATUS_LABEL,
    delayStatus,
} from '../domain/status';
import { dayToMillis, toSeries } from '../domain/series';
import { AssetCard } from '../components/AssetCard';
import { Panel, Readout, StatusPill } from '../components/Panel';

/**
 * The asset register: every unit, its specification, its odometer and its
 * punctuality over the last month.
 */

const STATUS_OPTIONS: (TrainStatus | 'todos')[] = [
    'todos',
    'EN_SERVICIO',
    'EN_MANTENIMIENTO',
    'STANDBY',
];

export interface FleetViewProps {
    snapshot: TrainSnapshot[];
    selectedTrainId: string | null;
    onSelectTrain: (id: string) => void;
}

export default function FleetView({ snapshot, selectedTrainId, onSelectTrain }: FleetViewProps) {
    const [statusFilter, setStatusFilter] = useState<TrainStatus | 'todos'>('todos');
    const [history, setHistory] = useState<HistoryDay[]>([]);

    const visible = useMemo(
        () =>
            statusFilter === 'todos'
                ? snapshot
                : snapshot.filter((train) => train.status === statusFilter),
        [snapshot, statusFilter]
    );

    const selected = snapshot.find((train) => train.id === selectedTrainId) ?? snapshot[0] ?? null;
    const selectedId = selected?.id ?? null;

    // History follows the selection. It used to be loaded once for the API's
    // default train and rendered under whatever the operator had clicked.
    useEffect(() => {
        if (!selectedId) return;
        const controller = new AbortController();
        api.fetchHistory(30, selectedId, controller.signal)
            .then(setHistory)
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === 'AbortError') return;
                console.error('[Flota] historial:', error);
            });
        return () => controller.abort();
    }, [selectedId]);

    const punctuality = useMemo(
        () => toSeries(history, (day) => dayToMillis(day.date), (day) => day.otp),
        [history]
    );

    return (
        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                    <span className="label-mono">Estado</span>
                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value as TrainStatus | 'todos')
                        }
                        className="min-h-11 rounded-lg border border-steel/25 bg-navy-900 px-3 text-sm text-ice"
                    >
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option === 'todos'
                                    ? 'Todos los estados'
                                    : TRAIN_STATUS_LABEL[option]}
                            </option>
                        ))}
                    </select>
                </label>

                <p className="text-xs text-steel">
                    <span className="tabular">{visible.length}</span> de{' '}
                    <span className="tabular">{snapshot.length}</span> unidades
                </p>

                <ul className="m-0 flex max-h-[36rem] list-none flex-col gap-2 overflow-y-auto p-0 pr-1">
                    {visible.map((train) => (
                        <li key={train.id}>
                            <AssetCard
                                train={train}
                                selected={train.id === selectedId}
                                onSelect={onSelectTrain}
                            />
                        </li>
                    ))}
                </ul>
            </div>

            {selected ? (
                <div className="flex flex-col gap-4">
                    <Panel>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h2 className="font-display text-lg font-semibold text-ice">
                                    {selected.name}
                                </h2>
                                <p className="mt-1 text-sm text-steel">
                                    {selected.manufacturer} {selected.model} · {selected.yearBuilt}{' '}
                                    · {selected.callsign}
                                </p>
                            </div>
                            <StatusPill status={MAINT_URGENCY[selected.maintUrgency]}>
                                Mantenimiento: {MAINT_URGENCY_LABEL[selected.maintUrgency]}
                            </StatusPill>
                        </div>

                        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                            {(
                                [
                                    ['Tracción', TRACTION_LABEL[selected.traction]],
                                    ['Depósito', selected.depot],
                                    ['Servicio', SERVICE_KIND_LABEL[selected.type]],
                                    ['Velocidad máxima', `${selected.maxSpeedKmh} km/h`],
                                    ['Potencia', `${selected.powerKw.toLocaleString('es-EC')} kW`],
                                    ['Masa', `${selected.weightTons} t`],
                                    ['Longitud', `${selected.lengthM} m`],
                                    ['Ejes', `${selected.axleCount}`],
                                    [
                                        'Capacidad',
                                        `${selected.capacity.toLocaleString('es-EC')} ${
                                            selected.type === 'carga' ? 't' : 'plazas'
                                        }`,
                                    ],
                                ] as [string, string][]
                            ).map(([label, value]) => (
                                <div
                                    key={label}
                                    className="flex justify-between gap-3 border-b border-steel/10 pb-1"
                                >
                                    <dt className="text-steel">{label}</dt>
                                    <dd className="truncate text-right text-ice">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </Panel>

                    <Panel title="Odómetro y ciclo de mantenimiento">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            <Readout
                                label="Kilómetros acumulados"
                                value={selected.odometer.toLocaleString('es-EC')}
                                unit="km"
                            />
                            <Readout
                                label="Próxima intervención"
                                value={selected.nextMaintKm.toLocaleString('es-EC')}
                                unit="km"
                            />
                            <Readout
                                label="Restante"
                                value={selected.kmToNextMaint.toLocaleString('es-EC')}
                                unit="km"
                                status={MAINT_URGENCY[selected.maintUrgency]}
                            />
                        </div>
                        <span
                            className="mt-3 block h-1.5 rounded-full bg-navy-700"
                            role="progressbar"
                            aria-valuenow={Math.min(
                                100,
                                Math.round((selected.odometer / selected.nextMaintKm) * 100)
                            )}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label="Avance del ciclo de mantenimiento"
                        >
                            <span
                                className="block h-full rounded-full"
                                style={{
                                    width: `${Math.min(
                                        100,
                                        (selected.odometer / selected.nextMaintKm) * 100
                                    )}%`,
                                    backgroundColor: `var(--color-${
                                        selected.maintUrgency === 'CRITICA'
                                            ? 'alert'
                                            : selected.maintUrgency === 'PROXIMA'
                                              ? 'warn'
                                              : 'brand'
                                    })`,
                                }}
                            />
                        </span>
                    </Panel>

                    <Panel title="Viaje en curso">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            <Readout label="Velocidad" value={`${selected.speed}`} unit="km/h" />
                            <Readout
                                label="Puntualidad"
                                value={
                                    selected.delayMin <= 0
                                        ? 'A tiempo'
                                        : `+${selected.delayMin} min`
                                }
                                status={delayStatus(selected.delayMin)}
                            />
                            {selected.occupancy !== null ? (
                                <Readout
                                    label="Ocupación"
                                    value={`${selected.occupancy}`}
                                    unit="%"
                                    status={selected.occupancy > 85 ? 'warning' : 'ok'}
                                />
                            ) : (
                                <Readout
                                    label="Carga"
                                    value={(selected.tonsLoaded ?? 0).toLocaleString('es-EC')}
                                    unit="t"
                                />
                            )}
                        </div>
                    </Panel>

                    <Panel title={`Puntualidad de ${selected.id} — 30 días`}>
                        <TimeSeriesChart
                            points={punctuality}
                            label={`OTP diario de ${selected.name}`}
                            unit="%"
                            height={180}
                            band={{ low: 85, high: 100 }}
                        />
                        <p className="mt-2 text-xs text-steel">
                            La banda marca el objetivo contractual: 85 % o más de servicios dentro
                            de los 3 minutos.
                        </p>
                    </Panel>
                </div>
            ) : (
                <Panel>
                    <p className="text-sm text-steel">
                        No hay unidades que coincidan con el filtro.
                    </p>
                </Panel>
            )}
        </div>
    );
}
