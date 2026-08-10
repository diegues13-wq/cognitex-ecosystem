import { useId, useMemo, useState } from 'react';
import { DataSourceBadge, StatusDot, TimeSeriesChart } from '@cognitex/ui';
import type { DataSource } from '@cognitex/data';

import {
    GOALS,
    controlSeries,
    controlStatus,
    controlTrend,
    findGoal,
    latestPoint,
    pareto,
    repeatOffenders,
    toleranceBand,
    vitalFew,
    ROOT_CAUSES,
    type FailureEntry,
    type Goal,
} from '../domain';
import { ParetoTable } from '../components/ParetoTable';
import { Section } from '../components/Section';

/**
 * Where the failures come from and whether the loop is converging.
 *
 * The control panel here plots a process variable computed from the log. Its
 * predecessor plotted `generateControlLoopData()` — a seeded random walk —
 * under the axis label "PV (Valor Real)", for goals the app never measured.
 * When a goal has no measurement, this says so and draws nothing.
 */

export interface AnalisisViewProps {
    entries: readonly FailureEntry[];
    source: DataSource;
    updatedAt: number | null;
    days: number;
    now: number;
}

export function AnalisisView({ entries, source, updatedAt, days, now }: AnalisisViewProps) {
    const goalSelectId = useId();
    const [goalId, setGoalId] = useState(GOALS[0]?.id ?? '');

    const goal: Goal = findGoal(goalId) ?? (GOALS[0] as Goal);

    const rows = useMemo(() => pareto(entries), [entries]);
    const vital = useMemo(() => vitalFew(rows), [rows]);
    const offenders = useMemo(() => repeatOffenders(entries), [entries]);

    const series = useMemo(
        () => controlSeries(goal, entries, { days, now }),
        [goal, entries, days, now]
    );

    const latest = latestPoint(series);
    const trend = controlTrend(series, goal);
    const status = latest ? controlStatus(latest.error, goal) : 'offline';
    const vitalShare = vital.at(-1)?.cumulative ?? 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-sm font-semibold text-ice">
                    Análisis de causas y control
                </h2>
                <DataSourceBadge source={source} updatedAt={updatedAt} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Section
                    title="Pareto de causas raíz"
                    hint={
                        vital.length > 0
                            ? `${vital.length} ${
                                  vital.length === 1 ? 'causa explica' : 'causas explican'
                              } el ${vitalShare.toFixed(0)}% de los fallos`
                            : 'Sin fallos en el periodo'
                    }
                >
                    <ParetoTable rows={rows} />
                </Section>

                <Section
                    title="Reincidencia por causa"
                    hint="Causas que volvieron a aparecer dentro de la ventana de 14 días."
                >
                    {offenders.length === 0 ? (
                        <p className="py-8 text-center text-sm text-steel">
                            Ninguna causa se repitió dentro de la ventana.
                        </p>
                    ) : (
                        <ul className="space-y-3">
                            {offenders.map((offender) => (
                                <li
                                    key={offender.cause}
                                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-steel/10 pb-3 last:border-0 last:pb-0"
                                >
                                    <span className="text-sm text-ice">
                                        {ROOT_CAUSES[offender.cause].label}
                                    </span>
                                    <span className="text-xs text-steel">
                                        <span className="tabular text-ice">
                                            {offender.repeats}
                                        </span>{' '}
                                        de {offender.occurrences} repeticiones
                                        {offender.lastGapDays !== null && (
                                            <> · última a {offender.lastGapDays} días</>
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>
            </div>

            <Section
                title="Lazo de control"
                hint={goal.definition}
                aside={
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-xs text-steel">
                            <StatusDot status={status} />
                            {latest
                                ? `Error ${latest.error > 0 ? '+' : ''}${latest.error.toFixed(
                                      goal.precision
                                  )} ${goal.unit}`
                                : 'Sin medición'}
                        </span>
                        <label htmlFor={goalSelectId} className="sr-only">
                            Meta bajo control
                        </label>
                        <select
                            id={goalSelectId}
                            value={goalId}
                            onChange={(event) => setGoalId(event.target.value)}
                            className="min-h-11 rounded-lg border border-steel/25 bg-navy-900 px-3 text-sm text-ice outline-none focus:border-[var(--color-brand)]"
                        >
                            {GOALS.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>
                }
            >
                {series.length === 0 ? (
                    <p className="py-8 text-center text-sm text-steel">
                        El registro no contiene mediciones para esta meta en el periodo.
                    </p>
                ) : (
                    <>
                        <TimeSeriesChart
                            points={series.map((point) => ({ at: point.at, value: point.actual }))}
                            label={`${goal.name} — valor medido`}
                            unit={goal.unit}
                            height={240}
                            band={toleranceBand(goal)}
                        />
                        <p className="mt-3 text-xs text-steel">
                            Setpoint {goal.target}
                            {goal.unit} · tolerancia ±{goal.tolerance}
                            {goal.unit} · la banda sombreada es el rango aceptable.
                            {trend !== null && (
                                <>
                                    {' '}
                                    Respecto a la medición anterior:{' '}
                                    <span
                                        className="tabular"
                                        style={{
                                            color:
                                                trend >= 0
                                                    ? 'var(--color-ok)'
                                                    : 'var(--color-alert)',
                                        }}
                                    >
                                        {trend >= 0 ? '+' : ''}
                                        {(trend * 100).toFixed(1)}%
                                    </span>
                                    .
                                </>
                            )}
                        </p>
                    </>
                )}
            </Section>
        </div>
    );
}
