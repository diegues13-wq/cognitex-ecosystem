import { useMemo, useState } from 'react';
import { DataSourceBadge, StatusDot, TimeSeriesChart } from '@cognitex/ui';
import type { DataSource, PersonalReading } from '@cognitex/data';

import {
    EXPOSURE_LIMITS,
    HOUR_MS,
    WORKERS,
    crewExposure,
    exposureThreshold,
    exposureWindows,
    findWorker,
    formatDuration,
    recentWindows,
    shortStamp,
    toSeries,
    type ExposureKind,
} from '../domain';
import { Section } from '../components/Section';
import { WorkerSelect } from '../components/WorkerSelect';

/**
 * How long each person spent over a physiological limit.
 *
 * A peak is not an exposure. The panel this replaces listed instantaneous
 * readings over a fixed number — `d.vpd > 130`, the same 130 bpm for a
 * 31-year-old chemist and a 52-year-old driver — and called them events. A
 * heart rate touching 90% of maximum for one sample during a lift is normal
 * work; holding it there for twenty minutes is a finding, and only the second
 * one appears here.
 */

const KINDS: readonly ExposureKind[] = ['termica', 'cardiaca'];

export interface ExposicionViewProps {
    readings: readonly PersonalReading[];
    source: DataSource;
    updatedAt: number | null;
    now: number;
}

export function ExposicionView({ readings, source, updatedAt, now }: ExposicionViewProps) {
    const [selectedId, setSelectedId] = useState(WORKERS[0]!.id);
    const [kind, setKind] = useState<ExposureKind>('termica');

    const crew = useMemo(
        () => KINDS.map((each) => ({ kind: each, rows: crewExposure(readings, WORKERS, each, now) })),
        [readings, now]
    );

    const selected = findWorker(selectedId) ?? WORKERS[0]!;

    const detail = useMemo(() => {
        const windows = recentWindows(exposureWindows(readings, kind, selected), {
            now,
            windowMs: 7 * 24 * HOUR_MS,
        });
        const own = readings.filter((reading) => reading.assetId === selected.id);

        return {
            windows,
            points: toSeries(own, kind === 'termica' ? 'bodyTemperature' : 'heartRate'),
            threshold: exposureThreshold(kind, selected),
        };
    }, [readings, kind, selected, now]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-sm font-semibold text-ice">
                    Exposición · últimas 24 horas
                </h2>
                <DataSourceBadge source={source} updatedAt={updatedAt} />
            </div>

            {crew.map(({ kind: each, rows }) => {
                const limit = EXPOSURE_LIMITS[each];

                return (
                    <Section
                        key={each}
                        title={limit.label}
                        hint={
                            each === 'termica'
                                ? `Temperatura corporal profunda sobre ${exposureThreshold('termica', WORKERS[0]!)} °C. Presupuesto diario: ${formatDuration(limit.dailyBudgetMs)}.`
                                : `Sobre el 85% de la frecuencia cardíaca máxima de cada persona, no un umbral común. Presupuesto diario: ${formatDuration(limit.dailyBudgetMs)}.`
                        }
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-160 border-collapse text-sm">
                                <caption className="sr-only">
                                    {limit.label} por trabajador en las últimas 24 horas
                                </caption>
                                <thead>
                                    <tr className="border-b border-steel/15">
                                        <th
                                            scope="col"
                                            className="label-mono px-3 py-2 text-left"
                                        >
                                            Trabajador
                                        </th>
                                        <th
                                            scope="col"
                                            className="label-mono px-3 py-2 text-right"
                                        >
                                            Umbral
                                        </th>
                                        <th
                                            scope="col"
                                            className="label-mono px-3 py-2 text-right"
                                        >
                                            Ventanas
                                        </th>
                                        <th
                                            scope="col"
                                            className="label-mono px-3 py-2 text-right"
                                        >
                                            Tiempo total
                                        </th>
                                        <th
                                            scope="col"
                                            className="label-mono px-3 py-2 text-right"
                                        >
                                            Más larga
                                        </th>
                                        <th
                                            scope="col"
                                            className="label-mono px-3 py-2 text-right"
                                        >
                                            Del presupuesto
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map(({ worker, budget }) => (
                                        <tr
                                            key={worker.id}
                                            className="border-b border-steel/10"
                                        >
                                            <th
                                                scope="row"
                                                className="px-3 py-2.5 text-left font-normal text-ice"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <StatusDot status={budget.status} />
                                                    {worker.name}
                                                </span>
                                            </th>
                                            <td className="tabular px-3 py-2.5 text-right text-steel">
                                                {exposureThreshold(each, worker).toFixed(
                                                    limit.precision
                                                )}{' '}
                                                {limit.unit}
                                            </td>
                                            {/* Zero windows renders as 0, which is the best reading. */}
                                            <td className="tabular px-3 py-2.5 text-right text-steel">
                                                {budget.windows}
                                            </td>
                                            <td className="tabular px-3 py-2.5 text-right text-ice">
                                                {budget.totalMs === 0
                                                    ? '0 min'
                                                    : formatDuration(budget.totalMs)}
                                            </td>
                                            <td className="tabular px-3 py-2.5 text-right text-steel">
                                                {budget.longestMs === 0
                                                    ? '0 min'
                                                    : formatDuration(budget.longestMs)}
                                            </td>
                                            <td className="tabular px-3 py-2.5 text-right">
                                                <span
                                                    style={{
                                                        color:
                                                            budget.used > 100
                                                                ? 'var(--color-alert)'
                                                                : undefined,
                                                    }}
                                                >
                                                    {budget.used.toFixed(0)} %
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Section>
                );
            })}

            <Section
                title="Ventanas de exposición · 7 días"
                hint="Una ventana abre en la primera lectura sobre el umbral y cierra en la primera que vuelve por debajo."
                aside={
                    <div className="flex flex-wrap items-center gap-2">
                        <fieldset className="flex items-center gap-1">
                            <legend className="sr-only">Tipo de exposición</legend>
                            {KINDS.map((each) => (
                                <button
                                    key={each}
                                    type="button"
                                    onClick={() => setKind(each)}
                                    aria-pressed={kind === each}
                                    className={`min-h-11 rounded-lg border px-3 text-sm ${
                                        kind === each
                                            ? 'border-transparent text-navy-900'
                                            : 'border-steel/25 text-steel hover:text-ice'
                                    }`}
                                    style={
                                        kind === each
                                            ? { backgroundColor: 'var(--color-brand)' }
                                            : undefined
                                    }
                                >
                                    {EXPOSURE_LIMITS[each].label}
                                </button>
                            ))}
                        </fieldset>
                        <WorkerSelect value={selectedId} onChange={setSelectedId} />
                    </div>
                }
            >
                <div className="space-y-6">
                    <TimeSeriesChart
                        points={detail.points}
                        label={`${EXPOSURE_LIMITS[kind].label} · ${selected.name}`}
                        unit={EXPOSURE_LIMITS[kind].unit}
                        height={200}
                        band={{ low: 0, high: detail.threshold }}
                    />

                    {detail.windows.length === 0 ? (
                        <p className="text-sm" style={{ color: 'var(--color-ok)' }}>
                            {selected.name} no superó el umbral en los últimos siete días.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-120 border-collapse text-sm">
                                <caption className="sr-only">
                                    Ventanas de exposición de {selected.name}
                                </caption>
                                <thead>
                                    <tr className="border-b border-steel/15">
                                        <th
                                            scope="col"
                                            className="label-mono px-3 py-2 text-left"
                                        >
                                            Inicio
                                        </th>
                                        <th
                                            scope="col"
                                            className="label-mono px-3 py-2 text-right"
                                        >
                                            Duración
                                        </th>
                                        <th
                                            scope="col"
                                            className="label-mono px-3 py-2 text-right"
                                        >
                                            Pico
                                        </th>
                                        <th
                                            scope="col"
                                            className="label-mono px-3 py-2 text-left"
                                        >
                                            Cierre
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detail.windows.map((window) => (
                                        <tr
                                            key={window.from}
                                            className="border-b border-steel/10"
                                        >
                                            <td className="px-3 py-2.5 whitespace-nowrap text-ice">
                                                {shortStamp(window.from)}
                                            </td>
                                            <td className="tabular px-3 py-2.5 text-right text-ice">
                                                {formatDuration(window.durationMs)}
                                            </td>
                                            <td className="tabular px-3 py-2.5 text-right text-steel">
                                                {window.peak.toFixed(
                                                    EXPOSURE_LIMITS[kind].precision
                                                )}{' '}
                                                {EXPOSURE_LIMITS[kind].unit}
                                            </td>
                                            <td className="px-3 py-2.5 whitespace-nowrap text-steel">
                                                {window.resolved ? (
                                                    shortStamp(window.to)
                                                ) : (
                                                    <span
                                                        style={{ color: 'var(--color-warn)' }}
                                                    >
                                                        aún por encima
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Section>
        </div>
    );
}
