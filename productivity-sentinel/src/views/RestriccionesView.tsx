import { useMemo } from 'react';
import { DataSourceBadge, MetricCard } from '@cognitex/ui';
import type { DataSource, Metric } from '@cognitex/data';

import {
    daysInStatus,
    priorityConstraint,
    tallyConstraints,
    type Constraint,
    type ConstraintStatus,
} from '../domain';
import { ConstraintBoard } from '../components/ConstraintBoard';
import { Section } from '../components/Section';

/**
 * The constraints that gate the plan.
 *
 * The priority constraint is computed — most goals blocked, then oldest —
 * rather than being whichever card the seed file listed first, which is what
 * `RESTRICTIONS.find(r => r.estado === 'activa')` returned.
 */

export interface RestriccionesViewProps {
    constraints: readonly Constraint[];
    source: DataSource;
    updatedAt: number | null;
    now: number;
    onMove: (constraint: Constraint, to: ConstraintStatus) => Promise<void>;
}

export function RestriccionesView({
    constraints,
    source,
    updatedAt,
    now,
    onMove,
}: RestriccionesViewProps) {
    const { metrics, priority } = useMemo(() => {
        const tally = tallyConstraints(constraints);
        const top = priorityConstraint(constraints, now);

        const cards: Metric[] = [
            {
                id: 'open',
                label: 'Abiertas',
                value: tally.open,
                unit: '',
                precision: 0,
                status: tally.open === 0 ? 'ok' : tally.open <= 2 ? 'warning' : 'alert',
                trend: null,
            },
            {
                id: 'experiment',
                label: 'En experimento',
                value: tally.en_experimento,
                unit: '',
                precision: 0,
                status: 'warning',
                trend: null,
            },
            {
                id: 'neutralised',
                label: 'Neutralizadas',
                value: tally.neutralizada,
                unit: '',
                precision: 0,
                status: tally.neutralizada > 0 ? 'ok' : 'offline',
                trend: null,
            },
        ];

        return { metrics: cards, priority: top };
    }, [constraints, now]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-sm font-semibold text-ice">
                    Panel de restricciones
                </h2>
                <DataSourceBadge source={source} updatedAt={updatedAt} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {metrics.map((metric) => (
                    <MetricCard
                        key={metric.id}
                        metric={metric}
                        generated={source === 'generated'}
                    />
                ))}
            </div>

            {priority && (
                <Section
                    title="Restricción prioritaria"
                    hint="La que bloquea más metas; a igualdad, la más antigua."
                >
                    <p className="text-sm text-ice">{priority.description}</p>
                    <p className="mt-1.5 text-xs text-steel">
                        {daysInStatus(priority, now)} días en estado actual · bloquea{' '}
                        {priority.goalIds.length}{' '}
                        {priority.goalIds.length === 1 ? 'meta' : 'metas'}
                    </p>
                </Section>
            )}

            <Section
                title="Tablero"
                hint="Ninguna restricción pasa a neutralizada sin haber estado en experimento."
            >
                <ConstraintBoard constraints={constraints} now={now} onMove={onMove} />
            </Section>
        </div>
    );
}
