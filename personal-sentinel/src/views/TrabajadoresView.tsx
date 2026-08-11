import { useMemo, useState } from 'react';
import { DataSourceBadge, MetricCard, StatusDot, TimeSeriesChart } from '@cognitex/ui';
import type { DataSource, Metric, PersonalReading } from '@cognitex/data';

import {
    DRIVER_LABEL,
    MEASUREMENTS,
    ROLE_LABEL,
    WORKERS,
    WORK_SHIFT,
    dominantDriver,
    findWorker,
    heartRateReserve,
    latestFor,
    maxHeartRate,
    rank,
    scoreFatigue,
    shortStamp,
    toSeries,
    wearableCoverage,
    type FatigueScore,
    type Measurement,
    type Worker,
} from '../domain';
import { Section } from '../components/Section';
import { WorkerSelect } from '../components/WorkerSelect';

/**
 * The whole crew, then one person in detail.
 *
 * The old console could only show one worker: it fetched the selected one's
 * history and rendered the other four from their *baseline* constants as if
 * they were live readings, so four of the five status dots were computed from
 * a literal and were green forever.
 */

const CHARTED: readonly Measurement[] = [
    'heartRate',
    'fatigue',
    'bodyTemperature',
    'wearableBattery',
];

export interface TrabajadoresViewProps {
    readings: readonly PersonalReading[];
    source: DataSource;
    updatedAt: number | null;
    now: number;
}

interface Row {
    worker: Worker;
    latest: PersonalReading | null;
    score: FatigueScore | null;
    reporting: boolean;
}

export function TrabajadoresView({
    readings,
    source,
    updatedAt,
    now,
}: TrabajadoresViewProps) {
    const [selectedId, setSelectedId] = useState(WORKERS[0]!.id);
    const generated = source === 'generated';

    const rows = useMemo<Row[]>(
        () =>
            WORKERS.map((worker) => {
                const latest = latestFor(readings, worker.id);
                return {
                    worker,
                    latest,
                    score: latest ? scoreFatigue(latest, worker, WORK_SHIFT) : null,
                    reporting: !wearableCoverage(readings, worker, now).stale,
                };
            }),
        [readings, now]
    );

    const selected = findWorker(selectedId) ?? WORKERS[0]!;

    const detail = useMemo(() => {
        const own = readings.filter((reading) => reading.assetId === selected.id);
        const latest = latestFor(own, selected.id);
        if (!latest) return { own, latest, cards: [] as Metric[] };

        const score = scoreFatigue(latest, selected, WORK_SHIFT);
        const reserve = heartRateReserve(latest.heartRate, selected);

        const cards: Metric[] = [
            {
                id: 'fatigue',
                label: `Fatiga · ${score.band}`,
                value: score.score,
                unit: '%',
                precision: 0,
                status: score.status,
                trend: null,
            },
            {
                id: 'heart',
                label: `Ritmo cardíaco · ${reserve.toFixed(0)}% de reserva`,
                value: latest.heartRate,
                unit: 'bpm',
                precision: 0,
                status: rank(reserve, 60, 85, false),
                trend: null,
            },
            {
                id: 'temperature',
                label: 'Temperatura corporal',
                value: latest.bodyTemperature,
                unit: '°C',
                precision: 1,
                status: rank(latest.bodyTemperature, 37.5, 38.5, false),
                trend: null,
            },
            {
                id: 'battery',
                label: 'Batería del casco',
                value: latest.wearableBattery,
                unit: '%',
                precision: 0,
                status: rank(latest.wearableBattery, 30, 10),
                trend: null,
            },
        ];

        return { own, latest, cards };
    }, [readings, selected]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-sm font-semibold text-ice">Trabajadores</h2>
                <DataSourceBadge source={source} updatedAt={updatedAt} />
            </div>

            <Section
                title="Estado actual"
                hint={`Umbral cardíaco individual: 85% de (220 − edad), entre ${Math.round(minThreshold())} y ${Math.round(maxThreshold())} bpm según la persona.`}
            >
                <div className="overflow-x-auto">
                    <table className="w-full min-w-160 border-collapse text-sm">
                        <caption className="sr-only">
                            Fatiga, biométricos y estado del wearable por trabajador
                        </caption>
                        <thead>
                            <tr className="border-b border-steel/15">
                                <th scope="col" className="label-mono px-3 py-2 text-left">
                                    Trabajador
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-left">
                                    Área
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-right">
                                    Fatiga
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-left">
                                    Factor dominante
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-right">
                                    FC
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-right">
                                    Temp.
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-left">
                                    Última lectura
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(({ worker, latest, score, reporting }) => (
                                <tr key={worker.id} className="border-b border-steel/10">
                                    <th
                                        scope="row"
                                        className="px-3 py-2.5 text-left font-normal text-ice"
                                    >
                                        <span className="flex items-center gap-2">
                                            <StatusDot
                                                status={reporting ? (score?.status ?? 'offline') : 'offline'}
                                            />
                                            {worker.name}
                                            <span className="text-steel">
                                                · {ROLE_LABEL[worker.role]}
                                            </span>
                                        </span>
                                    </th>
                                    <td className="px-3 py-2.5 text-steel">{worker.area}</td>
                                    <td className="tabular px-3 py-2.5 text-right text-ice">
                                        {score === null ? '—' : `${score.score.toFixed(0)} %`}
                                    </td>
                                    <td className="px-3 py-2.5 whitespace-nowrap text-steel">
                                        {score === null
                                            ? '—'
                                            : DRIVER_LABEL[dominantDriver(score.drivers)]}
                                    </td>
                                    <td className="tabular px-3 py-2.5 text-right text-steel">
                                        {latest ? `${latest.heartRate} bpm` : '—'}
                                    </td>
                                    <td className="tabular px-3 py-2.5 text-right text-steel">
                                        {latest
                                            ? `${latest.bodyTemperature.toFixed(1)} °C`
                                            : '—'}
                                    </td>
                                    <td className="px-3 py-2.5 whitespace-nowrap text-steel">
                                        {latest ? shortStamp(latest.at) : 'Sin datos'}
                                        {latest && !reporting && (
                                            <span
                                                className="ml-2"
                                                style={{ color: 'var(--color-warn)' }}
                                            >
                                                casco en silencio
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>

            <Section
                title="Detalle"
                hint={`${selected.age} años · FC máxima estimada ${maxHeartRate(selected.age)} bpm · reposo ${selected.restingHeartRate} bpm`}
                aside={<WorkerSelect value={selectedId} onChange={setSelectedId} />}
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

function minThreshold(): number {
    return Math.min(...WORKERS.map((worker) => maxHeartRate(worker.age) * 0.85));
}

function maxThreshold(): number {
    return Math.max(...WORKERS.map((worker) => maxHeartRate(worker.age) * 0.85));
}
