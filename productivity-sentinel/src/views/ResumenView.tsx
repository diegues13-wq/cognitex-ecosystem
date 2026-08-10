import { useMemo } from 'react';
import { DataSourceBadge, MetricCard, TimeSeriesChart } from '@cognitex/ui';
import type { DataSource, Metric } from '@cognitex/data';
import type { Status } from '@cognitex/theme';

import {
    adherence,
    computePpc,
    recurrenceRate,
    recurrenceTrend,
    tallyConstraints,
    weeklyPpc,
    type Constraint,
    type FailureEntry,
} from '../domain';
import { Section } from '../components/Section';

/**
 * The state of the loop, in six numbers.
 *
 * Every card is a `MetricCard` from `@cognitex/ui`. The six bespoke cards this
 * replaces each computed their own status from an ad-hoc threshold pair and
 * rendered `value || '--'` — so an operator with zero open constraints, which
 * is the goal, saw "--" where the best possible reading should have been.
 */

export interface ResumenViewProps {
    entries: readonly FailureEntry[];
    constraints: readonly Constraint[];
    source: DataSource;
    updatedAt: number | null;
    days: number;
    now: number;
}

/** Thresholds read the same way for every card: better values first. */
function rank(value: number, good: number, warn: number, higherIsBetter = true): Status {
    if (!Number.isFinite(value)) return 'offline';
    if (higherIsBetter) {
        if (value >= good) return 'ok';
        return value >= warn ? 'warning' : 'alert';
    }
    if (value <= good) return 'ok';
    return value <= warn ? 'warning' : 'alert';
}

export function ResumenView({
    entries,
    constraints,
    source,
    updatedAt,
    days,
    now,
}: ResumenViewProps) {
    const generated = source === 'generated';

    const { metrics, trend } = useMemo(() => {
        const weeks = weeklyPpc(entries, { weeks: 8, now });
        const current = weeks.at(-1)?.result ?? computePpc([]);
        const previous = weeks.at(-2)?.result ?? null;
        const engagement = adherence(entries, { days, now });
        const recurrence = recurrenceRate(entries);
        const tally = tallyConstraints(constraints);

        const ppcTrend =
            previous && previous.planned > 0 && previous.ppc > 0
                ? (current.ppc - previous.ppc) / previous.ppc
                : null;

        const cards: Metric[] = [
            {
                id: 'ppc',
                label: 'PPC de la semana',
                value: current.ppc,
                unit: '%',
                precision: 0,
                // No commitment came due: that is not a score of zero.
                status: current.planned === 0 ? 'offline' : rank(current.ppc, 85, 70),
                trend: ppcTrend,
            },
            {
                id: 'recurrence',
                label: 'Tasa de recurrencia',
                value: recurrence,
                unit: '%',
                precision: 0,
                status: rank(recurrence, 30, 60, false),
                trend: null,
            },
            {
                id: 'adherence',
                label: `Adherencia · ${days} días`,
                value: engagement.rate,
                unit: '%',
                precision: 0,
                status: rank(engagement.rate, 80, 60),
                trend: null,
            },
            {
                id: 'streak',
                label: 'Racha de registro',
                value: engagement.streak,
                unit: 'días',
                precision: 0,
                status: rank(engagement.streak, 5, 2),
                trend: null,
            },
            {
                id: 'open',
                label: 'Restricciones abiertas',
                value: tally.open,
                unit: '',
                precision: 0,
                status: rank(tally.open, 1, 3, false),
                trend: null,
            },
            {
                id: 'neutralised',
                label: 'Restricciones neutralizadas',
                value: tally.neutralizada,
                unit: '',
                precision: 0,
                status: tally.neutralizada > 0 ? 'ok' : 'offline',
                trend: null,
            },
        ];

        return {
            metrics: cards,
            trend: recurrenceTrend(entries, { days, now }),
        };
    }, [entries, constraints, days, now]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-sm font-semibold text-ice">
                    Estado del lazo de mejora
                </h2>
                <DataSourceBadge source={source} updatedAt={updatedAt} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {metrics.map((metric) => (
                    <MetricCard key={metric.id} metric={metric} generated={generated} />
                ))}
            </div>

            <Section
                title="Recurrencia"
                hint="Promedio móvil de 7 días. Los días sin registros no se dibujan."
            >
                <TimeSeriesChart
                    points={trend}
                    label="Tasa de recurrencia"
                    unit="%"
                    height={220}
                    band={{ low: 0, high: 30 }}
                />
            </Section>
        </div>
    );
}
