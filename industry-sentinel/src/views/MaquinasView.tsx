import { useMemo, useState } from 'react';
import { DataSourceBadge, MetricCard, StatusDot, TimeSeriesChart } from '@cognitex/ui';
import type { DataSource, IndustryReading, Metric } from '@cognitex/data';
import type { Status } from '@cognitex/theme';

import {
    MACHINES,
    MEASUREMENTS,
    PRODUCTION_SHIFT,
    computeOee,
    findMachine,
    latestFor,
    machineStatus,
    rank,
    shortStamp,
    toSeries,
    type Machine,
    type Measurement,
} from '../domain';
import { MachineSelect } from '../components/MachineSelect';
import { Section } from '../components/Section';

/**
 * Every machine at once, then one machine in detail.
 *
 * The old console could only ever show one machine: it fetched the selected
 * one's history and rendered the other four with their *nameplate* base values
 * as if they were live readings, so four of the five status dots were computed
 * from a constant and were green forever.
 */

const CHARTED: readonly Measurement[] = ['temperature', 'vibration', 'power', 'speed'];

export interface MaquinasViewProps {
    readings: readonly IndustryReading[];
    source: DataSource;
    updatedAt: number | null;
}

interface Row {
    machine: Machine;
    latest: IndustryReading | null;
    status: Status;
    oee: number | null;
}

export function MaquinasView({ readings, source, updatedAt }: MaquinasViewProps) {
    const [selectedId, setSelectedId] = useState(MACHINES[0]!.id);
    const generated = source === 'generated';

    const rows = useMemo<Row[]>(
        () =>
            MACHINES.map((machine) => {
                const latest = latestFor(readings, machine.id);
                const own = readings.filter((reading) => reading.assetId === machine.id);
                const oee = computeOee(own, machine, PRODUCTION_SHIFT).reportedOee;

                return {
                    machine,
                    latest,
                    // No reading at all is offline; that is different from a
                    // machine that reported and is idle.
                    status: latest ? machineStatus(latest, machine) : 'offline',
                    oee,
                };
            }),
        [readings]
    );

    const selected = findMachine(selectedId) ?? MACHINES[0]!;

    const detail = useMemo(() => {
        const own = readings.filter((reading) => reading.assetId === selected.id);
        const latest = latestFor(own, selected.id);

        const cards: Metric[] = latest
            ? [
                  {
                      id: 'temperature',
                      label: 'Temperatura',
                      value: latest.temperature,
                      unit: '°C',
                      precision: 1,
                      status: rank(
                          latest.temperature,
                          selected.temperatureAlarm * 0.85,
                          selected.temperatureAlarm,
                          false
                      ),
                      trend: null,
                  },
                  {
                      id: 'vibration',
                      label: 'Vibración RMS',
                      value: latest.vibration,
                      unit: 'mm/s',
                      precision: 2,
                      status: rank(
                          latest.vibration,
                          selected.vibrationAlarm * 0.7,
                          selected.vibrationAlarm,
                          false
                      ),
                      trend: null,
                  },
                  {
                      id: 'power',
                      label: 'Potencia',
                      value: latest.power,
                      unit: 'W',
                      precision: 0,
                      status: rank(
                          latest.power,
                          selected.powerAlarm * 0.9,
                          selected.powerAlarm,
                          false
                      ),
                      trend: null,
                  },
                  {
                      id: 'speed',
                      label: 'Velocidad',
                      value: latest.speed,
                      unit: 'rpm',
                      precision: 0,
                      // A stopped line reads zero rpm, and zero is the reading.
                      status:
                          latest.speed === 0
                              ? 'offline'
                              : rank((latest.speed / selected.ratedSpeed) * 100, 90, 75),
                      trend: null,
                  },
              ]
            : [];

        return { own, latest, cards };
    }, [readings, selected]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-sm font-semibold text-ice">Máquinas</h2>
                <DataSourceBadge source={source} updatedAt={updatedAt} />
            </div>

            <Section title="Estado actual" hint="Última lectura de cada máquina de la planta.">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-160 border-collapse text-sm">
                        <caption className="sr-only">
                            Estado, OEE y últimas lecturas por máquina
                        </caption>
                        <thead>
                            <tr className="border-b border-steel/15">
                                <th scope="col" className="label-mono px-3 py-2 text-left">
                                    Máquina
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-left">
                                    Área
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-left">
                                    Estado
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-right">
                                    OEE
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-right">
                                    Temp.
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-right">
                                    Vibración
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-right">
                                    Velocidad
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-left">
                                    Última lectura
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(({ machine, latest, status, oee }) => (
                                <tr key={machine.id} className="border-b border-steel/10">
                                    <th
                                        scope="row"
                                        className="px-3 py-2.5 text-left font-normal text-ice"
                                    >
                                        {machine.name}
                                    </th>
                                    <td className="px-3 py-2.5 text-steel">{machine.area}</td>
                                    <td className="px-3 py-2.5">
                                        <span className="flex items-center gap-2">
                                            <StatusDot status={status} />
                                            <span className="text-steel">
                                                {STATUS_LABEL[status]}
                                            </span>
                                        </span>
                                    </td>
                                    <td className="tabular px-3 py-2.5 text-right text-ice">
                                        {oee === null ? '—' : `${oee.toFixed(1)} %`}
                                    </td>
                                    <td className="tabular px-3 py-2.5 text-right text-steel">
                                        {latest ? `${latest.temperature.toFixed(1)} °C` : '—'}
                                    </td>
                                    <td className="tabular px-3 py-2.5 text-right text-steel">
                                        {latest ? `${latest.vibration.toFixed(2)} mm/s` : '—'}
                                    </td>
                                    <td className="tabular px-3 py-2.5 text-right text-steel">
                                        {latest ? `${latest.speed} rpm` : '—'}
                                    </td>
                                    <td className="px-3 py-2.5 whitespace-nowrap text-steel">
                                        {latest ? shortStamp(latest.at) : 'Sin datos'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>

            <Section
                title="Detalle"
                hint={`Límites propios de la máquina: ${selected.temperatureAlarm} °C · ${selected.vibrationAlarm} mm/s · ${selected.powerAlarm} W`}
                aside={<MachineSelect value={selectedId} onChange={setSelectedId} />}
            >
                {detail.latest === null ? (
                    <p className="py-8 text-center text-sm text-steel">
                        {selected.name} no ha reportado en el periodo consultado.
                    </p>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {detail.cards.map((metric) => (
                                <MetricCard
                                    key={metric.id}
                                    metric={metric}
                                    generated={generated}
                                />
                            ))}
                        </div>

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                            {CHARTED.map((measurement) => (
                                <TimeSeriesChart
                                    key={measurement}
                                    points={toSeries(detail.own, measurement)}
                                    label={`${MEASUREMENTS[measurement].label} · ${selected.name}`}
                                    unit={MEASUREMENTS[measurement].unit}
                                    height={180}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </Section>
        </div>
    );
}

const STATUS_LABEL: Record<Status, string> = {
    ok: 'Normal',
    warning: 'Advertencia',
    alert: 'Alarma',
    offline: 'Detenida',
};
