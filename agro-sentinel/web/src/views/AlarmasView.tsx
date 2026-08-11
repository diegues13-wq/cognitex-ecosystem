import { useMemo } from 'react';
import { DataSourceBadge, MetricCard } from '@cognitex/ui';
import type { Alert, DataSource, Metric } from '@cognitex/data';

import { evaluateSample, latestSample, tallyAlarms } from '../domain';
import type { Alarm, GreenhouseSample } from '../domain';
import { Section } from '../components/Section';
import { AlertFeed } from '../components/AlertFeed';
import { ConditionTable } from '../components/ConditionTable';

/**
 * Alarms, ISA-18.2 style.
 *
 * The feed and the condition table are deliberately two things. The feed is
 * the operational record — raised, acknowledged, returned to normal — and it
 * is persisted. The table is the evaluation of the newest sample against the
 * limits, recomputed on every load. The old console had only the second and
 * called it a feed: it re-derived every "event" from the visible window on
 * every render, so acknowledging was impossible and an alarm scrolled out of
 * existence when the time range changed.
 */

export interface AlarmasViewProps {
    samples: readonly GreenhouseSample[];
    alarms: readonly Alarm[];
    alerts: readonly Alert[];
    source: DataSource;
    updatedAt: number | null;
    onAcknowledge: (alert: Alert) => void;
}

export function AlarmasView({
    samples,
    alarms,
    alerts,
    source,
    updatedAt,
    onAcknowledge,
}: AlarmasViewProps) {
    const generated = source === 'generated';

    const { tally, conditions } = useMemo(() => {
        const newest = latestSample(samples);
        return {
            tally: tallyAlarms(alarms),
            conditions: newest ? evaluateSample(newest) : [],
        };
    }, [alarms, samples]);

    const metrics = useMemo<Metric[]>(
        () => [
            {
                id: 'standing',
                label: 'Alarmas activas',
                value: tally.standing,
                unit: '',
                precision: 0,
                status: tally.standing === 0 ? 'ok' : tally.critical > 0 ? 'alert' : 'warning',
                trend: null,
            },
            {
                id: 'critical',
                label: 'Críticas',
                value: tally.critical,
                unit: '',
                precision: 0,
                status: tally.critical === 0 ? 'ok' : 'alert',
                trend: null,
            },
            {
                id: 'unack',
                label: 'Sin reconocer',
                value: tally.unacknowledged,
                unit: '',
                precision: 0,
                status: tally.unacknowledged === 0 ? 'ok' : 'warning',
                trend: null,
            },
            {
                id: 'total',
                label: 'Episodios en el periodo',
                value: alarms.length,
                unit: '',
                precision: 0,
                status: 'offline',
                trend: null,
            },
        ],
        [tally, alarms.length]
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-sm font-semibold text-ice">Gestión de alarmas</h2>
                <DataSourceBadge source={source} updatedAt={updatedAt} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                    <MetricCard key={metric.id} metric={metric} generated={generated} />
                ))}
            </div>

            <Section
                title="Fuera de límites ahora"
                hint="Evaluación de la última lectura contra los límites críticos y de aviso, ordenada por prioridad."
            >
                <ConditionTable conditions={conditions} />
            </Section>

            <Section
                title="Registro de alarmas"
                hint={
                    generated
                        ? 'Derivado de las lecturas simuladas. El reconocimiento no se guarda en esta sesión de demostración.'
                        : 'Colección alerts. El reconocimiento se guarda con la hora del servidor.'
                }
            >
                <AlertFeed alerts={alerts} onAcknowledge={onAcknowledge} persisted={!generated} />
            </Section>
        </div>
    );
}
