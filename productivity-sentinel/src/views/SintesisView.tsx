import { useMemo } from 'react';
import { DataSourceBadge, MetricCard, TimeSeriesChart } from '@cognitex/ui';
import type { DataSource, Metric } from '@cognitex/data';

import {
    ROOT_CAUSES,
    implementationRate,
    shortDate,
    weeklyPpc,
    weeklySynthesis,
    type Constraint,
    type FailureEntry,
} from '../domain';
import { Section } from '../components/Section';

/**
 * The week, closed out.
 *
 * Every figure and every sentence below is a function of the week's entries
 * and the board. The panel this replaces returned a constant: the same
 * hypothesis, action and success metric every week for every user, behind a
 * "Generar nueva síntesis" button that waited 1.2 seconds and re-rendered the
 * identical text.
 */

export interface SintesisViewProps {
    entries: readonly FailureEntry[];
    constraints: readonly Constraint[];
    source: DataSource;
    updatedAt: number | null;
    now: number;
}

export function SintesisView({
    entries,
    constraints,
    source,
    updatedAt,
    now,
}: SintesisViewProps) {
    const synthesis = useMemo(
        () => weeklySynthesis(entries, constraints, now),
        [entries, constraints, now]
    );

    const ppcSeries = useMemo(
        () =>
            weeklyPpc(entries, { weeks: 8, now })
                .filter((week) => week.result.planned > 0)
                .map((week) => ({ at: week.weekStart, value: week.result.ppc })),
        [entries, now]
    );

    const weekEntries = useMemo(
        () =>
            entries.filter(
                (entry) => entry.at >= synthesis.weekStart && entry.at <= synthesis.weekEnd
            ),
        [entries, synthesis.weekStart, synthesis.weekEnd]
    );

    const metrics: Metric[] = [
        {
            id: 'ppc',
            label: 'PPC de la semana',
            value: synthesis.ppc.ppc,
            unit: '%',
            precision: 0,
            status:
                synthesis.ppc.planned === 0
                    ? 'offline'
                    : synthesis.ppc.ppc >= 85
                      ? 'ok'
                      : synthesis.ppc.ppc >= 70
                        ? 'warning'
                        : 'alert',
            trend:
                synthesis.previousPpc && synthesis.previousPpc.ppc > 0
                    ? (synthesis.ppc.ppc - synthesis.previousPpc.ppc) / synthesis.previousPpc.ppc
                    : null,
        },
        {
            id: 'entries',
            label: 'Fallos registrados',
            value: synthesis.entryCount,
            unit: '',
            precision: 0,
            status: synthesis.entryCount === 0 ? 'offline' : 'ok',
            trend: null,
        },
        {
            id: 'recurrence',
            label: 'Recurrencia semanal',
            value: synthesis.recurrence,
            unit: '%',
            precision: 0,
            status:
                synthesis.recurrence <= 30 ? 'ok' : synthesis.recurrence <= 60 ? 'warning' : 'alert',
            trend: null,
        },
        {
            id: 'open',
            label: 'Restricciones abiertas',
            value: synthesis.openConstraints,
            unit: '',
            precision: 0,
            status:
                synthesis.openConstraints === 0
                    ? 'ok'
                    : synthesis.openConstraints <= 2
                      ? 'warning'
                      : 'alert',
            trend: null,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="font-display text-sm font-semibold text-ice">
                        Semana {synthesis.weekNumber}
                    </h2>
                    <p className="mt-0.5 text-xs text-steel">
                        {shortDate(synthesis.weekStart)} – {shortDate(synthesis.weekEnd)} ·{' '}
                        {synthesis.adherence.daysLogged} de 7 días con registro
                    </p>
                </div>
                <DataSourceBadge source={source} updatedAt={updatedAt} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                    <MetricCard
                        key={metric.id}
                        metric={metric}
                        generated={source === 'generated'}
                    />
                ))}
            </div>

            <Section
                title="Cumplimiento semanal"
                hint="PPC por semana ISO. Sólo se dibujan las semanas con compromisos vencidos."
            >
                <TimeSeriesChart
                    points={ppcSeries}
                    label="PPC semanal"
                    unit="%"
                    height={200}
                    band={{ low: 90, high: 100 }}
                />
                <p className="mt-3 text-xs text-steel">
                    El PPC cuenta sólo los compromisos completos. Dando medio punto a los
                    parciales, esta semana llega al{' '}
                    <span className="tabular text-ice">
                        {implementationRate(weekEntries).toFixed(0)}%
                    </span>{' '}
                    ({synthesis.ppc.partial}{' '}
                    {synthesis.ppc.partial === 1 ? 'ajuste parcial' : 'ajustes parciales'},{' '}
                    {synthesis.ppc.pending} sin verificar).
                </p>
            </Section>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Section title="Causas dominantes de la semana">
                    {synthesis.dominant.length === 0 ? (
                        <p className="py-8 text-center text-sm text-steel">
                            No hubo fallos registrados esta semana.
                        </p>
                    ) : (
                        <ol className="space-y-4">
                            {synthesis.dominant.map((row) => (
                                <li key={row.cause}>
                                    <div className="flex items-baseline justify-between gap-3">
                                        <span className="text-sm text-ice">{row.label}</span>
                                        <span className="text-sm tabular text-steel">
                                            {row.share.toFixed(0)}%
                                        </span>
                                    </div>
                                    <span
                                        className="mt-1.5 block h-1.5 rounded-full"
                                        style={{
                                            width: `${row.share}%`,
                                            backgroundColor: 'var(--color-brand)',
                                        }}
                                        aria-hidden="true"
                                    />
                                    <p className="mt-1.5 text-xs text-steel">
                                        {ROOT_CAUSES[row.cause].definition}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    )}
                </Section>

                <Section
                    title="Restricción prioritaria"
                    hint={
                        synthesis.priority
                            ? `${synthesis.priorityDays} días en estado actual`
                            : undefined
                    }
                >
                    {synthesis.priority ? (
                        <>
                            <p className="text-sm text-ice">{synthesis.priority.description}</p>
                            <p className="mt-2 text-xs text-steel">
                                {ROOT_CAUSES[synthesis.priority.rootCause].label} · bloquea{' '}
                                {synthesis.priority.goalIds.length}{' '}
                                {synthesis.priority.goalIds.length === 1 ? 'meta' : 'metas'}
                            </p>
                        </>
                    ) : (
                        <p className="py-8 text-center text-sm text-steel">
                            No hay restricciones abiertas.
                        </p>
                    )}
                </Section>
            </div>

            <Section
                title="Experimento de la semana"
                hint="Derivado de la causa dominante y de la restricción prioritaria."
            >
                {synthesis.experiment ? (
                    <dl className="space-y-4">
                        <div>
                            <dt className="label-mono">Hipótesis</dt>
                            <dd className="mt-1 text-sm text-ice">
                                {synthesis.experiment.hypothesis}
                            </dd>
                        </div>
                        <div>
                            <dt className="label-mono">Acción</dt>
                            <dd className="mt-1 text-sm text-ice">{synthesis.experiment.action}</dd>
                        </div>
                        <div>
                            <dt className="label-mono">Métrica de éxito</dt>
                            <dd className="mt-1 text-sm" style={{ color: 'var(--color-brand)' }}>
                                {synthesis.experiment.metric}
                            </dd>
                        </div>
                    </dl>
                ) : (
                    <p className="py-8 text-center text-sm text-steel">
                        Sin registros esta semana: no hay base para proponer un experimento.
                    </p>
                )}
            </Section>
        </div>
    );
}
