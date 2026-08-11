import { useMemo, useState } from 'react';
import { DataSourceBadge, MetricCard, TimeSeriesChart } from '@cognitex/ui';
import type { DataSource, Metric, PersonalReading } from '@cognitex/data';

import {
    WORKERS,
    WORK_SHIFT,
    crewCoverage,
    crewExposure,
    dailyFatigue,
    findWorker,
    formatDuration,
    latestFor,
    manDownEpisodes,
    rank,
    scoreFatigue,
    shortStamp,
} from '../domain';
import { Section } from '../components/Section';
import { WorkerSelect } from '../components/WorkerSelect';

/**
 * The crew in six numbers, and the falls above everything else.
 *
 * Every card is a `MetricCard` from `@cognitex/ui`, which formats with
 * `Number.isFinite` rather than `value || '--'`. That matters here: zero
 * man-down episodes and zero minutes of heat exposure are the best possible
 * safety readings, and the old cards rendered exactly those as "no data".
 */

export interface ResumenViewProps {
    readings: readonly PersonalReading[];
    source: DataSource;
    updatedAt: number | null;
    now: number;
    days: number;
}

export function ResumenView({ readings, source, updatedAt, now, days }: ResumenViewProps) {
    const [selectedId, setSelectedId] = useState(WORKERS[0]!.id);
    const generated = source === 'generated';

    const { metrics, falls } = useMemo(() => {
        const scores = WORKERS.map((worker) => {
            const latest = latestFor(readings, worker.id);
            return latest ? scoreFatigue(latest, worker, WORK_SHIFT) : null;
        }).filter((score): score is NonNullable<typeof score> => score !== null);

        const meanFatigue =
            scores.length === 0
                ? Number.NaN
                : scores.reduce((sum, score) => sum + score.score, 0) / scores.length;
        const peakFatigue =
            scores.length === 0 ? Number.NaN : Math.max(...scores.map((score) => score.score));

        const coverage = crewCoverage(readings, WORKERS, now);
        const heat = crewExposure(readings, WORKERS, 'termica', now);
        const cardiac = crewExposure(readings, WORKERS, 'cardiaca', now);

        const heatMs = heat.reduce((sum, row) => sum + row.budget.totalMs, 0);
        const cardiacMs = cardiac.reduce((sum, row) => sum + row.budget.totalMs, 0);

        const episodes = manDownEpisodes(readings);

        const cards: Metric[] = [
            {
                id: 'fatigue-mean',
                label: 'Fatiga media de la cuadrilla',
                value: meanFatigue,
                unit: '%',
                precision: 0,
                status: Number.isFinite(meanFatigue) ? rank(meanFatigue, 30, 60, false) : 'offline',
                trend: null,
            },
            {
                id: 'fatigue-peak',
                label: 'Fatiga máxima individual',
                value: peakFatigue,
                unit: '%',
                precision: 0,
                status: Number.isFinite(peakFatigue) ? rank(peakFatigue, 30, 60, false) : 'offline',
                trend: null,
            },
            {
                id: 'mandown',
                label: `Hombre caído · ${days} días`,
                value: episodes.length,
                unit: '',
                precision: 0,
                // Zero is the reading everyone wants, and it renders as zero.
                status: episodes.length === 0 ? 'ok' : 'alert',
                trend: null,
            },
            {
                id: 'coverage',
                label: 'Cascos reportando',
                value: coverage.rate,
                unit: '%',
                precision: 0,
                status: rank(coverage.rate, 100, 80),
                trend: null,
            },
            {
                id: 'heat',
                label: 'Exposición térmica · 24 h',
                value: heatMs / 60_000,
                unit: 'min',
                precision: 0,
                status: rank(heatMs / 60_000, 0, 15, false),
                trend: null,
            },
            {
                id: 'cardiac',
                label: 'Exposición cardíaca · 24 h',
                value: cardiacMs / 60_000,
                unit: 'min',
                precision: 0,
                status: rank(cardiacMs / 60_000, 30, 60, false),
                trend: null,
            },
        ];

        return { metrics: cards, falls: episodes.slice(0, 8) };
    }, [readings, now, days]);

    const selected = findWorker(selectedId) ?? WORKERS[0]!;
    const trend = useMemo(
        () =>
            dailyFatigue(readings, selected, WORK_SHIFT).map((day) => ({
                at: day.day,
                value: day.mean,
            })),
        [readings, selected]
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-sm font-semibold text-ice">
                    Estado de la cuadrilla · {WORKERS.length} personas
                </h2>
                <DataSourceBadge source={source} updatedAt={updatedAt} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {metrics.map((metric) => (
                    <MetricCard key={metric.id} metric={metric} generated={generated} />
                ))}
            </div>

            <Section
                title="Eventos de hombre caído"
                hint="Tramos continuos con la alarma de caída activa en el wearable."
            >
                {falls.length === 0 ? (
                    <p className="py-6 text-center text-sm" style={{ color: 'var(--color-ok)' }}>
                        Ninguna caída detectada en el periodo.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-120 border-collapse text-sm">
                            <caption className="sr-only">
                                Episodios de hombre caído, del más reciente al más antiguo
                            </caption>
                            <thead>
                                <tr className="border-b border-steel/15">
                                    <th scope="col" className="label-mono px-3 py-2 text-left">
                                        Trabajador
                                    </th>
                                    <th scope="col" className="label-mono px-3 py-2 text-left">
                                        Inicio
                                    </th>
                                    <th scope="col" className="label-mono px-3 py-2 text-right">
                                        Duración
                                    </th>
                                    <th scope="col" className="label-mono px-3 py-2 text-left">
                                        Estado
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {falls.map((episode) => (
                                    <tr
                                        key={`${episode.assetId}-${episode.from}`}
                                        className="border-b border-steel/10"
                                    >
                                        <th
                                            scope="row"
                                            className="px-3 py-2.5 text-left font-normal text-ice"
                                        >
                                            {findWorker(episode.assetId)?.name ?? episode.assetId}
                                        </th>
                                        <td className="px-3 py-2.5 whitespace-nowrap text-steel">
                                            {shortStamp(episode.from)}
                                        </td>
                                        <td className="tabular px-3 py-2.5 text-right text-ice">
                                            {formatDuration(episode.durationMs)}
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            {episode.resolved ? (
                                                <span className="text-steel">Recuperado</span>
                                            ) : (
                                                <span style={{ color: 'var(--color-alert)' }}>
                                                    Sin resolver
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
                title="Fatiga diaria"
                hint="Media por día de las lecturas en turno. Las horas fuera de turno no se promedian: un trabajador en reposo puntúa cerca de cero y arrastraría la media."
                aside={<WorkerSelect value={selectedId} onChange={setSelectedId} />}
            >
                <TimeSeriesChart
                    points={trend}
                    label={`Fatiga media · ${selected.name}`}
                    unit="%"
                    height={220}
                    band={{ low: 0, high: 30 }}
                />
            </Section>
        </div>
    );
}
