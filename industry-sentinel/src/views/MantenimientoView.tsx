import { useMemo, useState } from 'react';
import { DataSourceBadge, StatusDot, TimeSeriesChart } from '@cognitex/ui';
import type { DataSource, IndustryReading } from '@cognitex/data';

import {
    MACHINES,
    findMachine,
    formatDuration,
    maintenanceQueue,
    toSeries,
    type VibrationZone,
} from '../domain';
import { MachineSelect } from '../components/MachineSelect';
import { Section } from '../components/Section';

/**
 * When each machine reaches its vibration limit.
 *
 * The panel this replaces was a static gradient bar at 20% width, the word
 * "BAJO", and "Próximo servicio: 340 hrs" — identical for all five machines
 * and connected to no measurement.
 *
 * Machines with no upward trend show "sin tendencia" rather than a comfortable
 * horizon. A maintenance plan built on a fabricated number is worse than one
 * built on none.
 */

const ZONE_TEXT: Record<VibrationZone, string> = {
    A: 'A · equipo nuevo',
    B: 'B · admisible a largo plazo',
    C: 'C · insatisfactorio',
    D: 'D · daño en curso',
};

export interface MantenimientoViewProps {
    readings: readonly IndustryReading[];
    source: DataSource;
    updatedAt: number | null;
    now: number;
}

export function MantenimientoView({
    readings,
    source,
    updatedAt,
    now,
}: MantenimientoViewProps) {
    const [selectedId, setSelectedId] = useState(MACHINES[0]!.id);

    const queue = useMemo(
        () => maintenanceQueue(MACHINES, readings, now),
        [readings, now]
    );

    const selected = findMachine(selectedId) ?? MACHINES[0]!;
    const selectedSeries = useMemo(
        () =>
            toSeries(
                readings.filter(
                    (reading) => reading.assetId === selected.id && reading.speed > 0
                ),
                'vibration'
            ),
        [readings, selected]
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-sm font-semibold text-ice">
                    Mantenimiento predictivo
                </h2>
                <DataSourceBadge source={source} updatedAt={updatedAt} />
            </div>

            <Section
                title="Cola de intervención"
                hint="Ajuste por mínimos cuadrados sobre la vibración en marcha. Las zonas escalan el límite propio de cada máquina; no son la tabla absoluta de ISO 10816."
            >
                {queue.length === 0 ? (
                    <p className="py-8 text-center text-sm text-steel">
                        Ninguna máquina ha reportado vibración en marcha en el periodo.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-160 border-collapse text-sm">
                            <caption className="sr-only">
                                Máquinas ordenadas por proximidad a su límite de vibración
                            </caption>
                            <thead>
                                <tr className="border-b border-steel/15">
                                    <th scope="col" className="label-mono px-3 py-2 text-left">
                                        Máquina
                                    </th>
                                    <th scope="col" className="label-mono px-3 py-2 text-left">
                                        Zona
                                    </th>
                                    <th scope="col" className="label-mono px-3 py-2 text-right">
                                        Vibración
                                    </th>
                                    <th scope="col" className="label-mono px-3 py-2 text-right">
                                        Límite
                                    </th>
                                    <th scope="col" className="label-mono px-3 py-2 text-right">
                                        Tendencia
                                    </th>
                                    <th scope="col" className="label-mono px-3 py-2 text-right">
                                        Horizonte
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {queue.map((forecast) => (
                                    <tr
                                        key={forecast.machine.id}
                                        className="border-b border-steel/10"
                                    >
                                        <th
                                            scope="row"
                                            className="px-3 py-2.5 text-left font-normal text-ice"
                                        >
                                            <span className="flex items-center gap-2">
                                                <StatusDot status={forecast.status} />
                                                {forecast.machine.name}
                                            </span>
                                        </th>
                                        <td className="px-3 py-2.5 whitespace-nowrap text-steel">
                                            {ZONE_TEXT[forecast.zone]}
                                        </td>
                                        <td className="tabular px-3 py-2.5 text-right text-ice">
                                            {forecast.trend.latest.toFixed(2)} mm/s
                                        </td>
                                        <td className="tabular px-3 py-2.5 text-right text-steel">
                                            {forecast.machine.vibrationAlarm.toFixed(1)} mm/s
                                        </td>
                                        <td className="tabular px-3 py-2.5 text-right text-steel">
                                            {forecast.trend.slopePerDay >= 0 ? '+' : ''}
                                            {forecast.trend.slopePerDay.toFixed(3)} mm/s·día
                                        </td>
                                        <td className="tabular px-3 py-2.5 text-right">
                                            {forecast.hoursToAlarm === null ? (
                                                <span className="text-steel">sin tendencia</span>
                                            ) : forecast.hoursToAlarm === 0 ? (
                                                <span style={{ color: 'var(--color-alert)' }}>
                                                    límite superado
                                                </span>
                                            ) : (
                                                <span className="text-ice">
                                                    {formatDuration(
                                                        forecast.hoursToAlarm * 3_600_000
                                                    )}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Section>

            <Section
                title="Vibración en marcha"
                hint="Sólo muestras con la máquina girando: la vibración de una máquina parada no mide nada."
                aside={<MachineSelect value={selectedId} onChange={setSelectedId} />}
            >
                <TimeSeriesChart
                    points={selectedSeries}
                    label={`Vibración RMS · ${selected.name}`}
                    unit="mm/s"
                    height={240}
                    band={{ low: 0, high: selected.vibrationAlarm * 0.7 }}
                />
            </Section>
        </div>
    );
}
