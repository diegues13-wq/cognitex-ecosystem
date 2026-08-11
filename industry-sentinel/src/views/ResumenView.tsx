import { useMemo } from 'react';
import { DataSourceBadge, MetricCard, TimeSeriesChart } from '@cognitex/ui';
import type { DataSource, IndustryReading, Metric } from '@cognitex/data';

import {
    MACHINES,
    PRODUCTION_SHIFT,
    dailyOee,
    downtimeEpisodes,
    formatDuration,
    oeeConsistency,
    plantOee,
    rank,
    reliability,
} from '../domain';
import { Section } from '../components/Section';

/**
 * The plant in six numbers.
 *
 * Every card is a `MetricCard` from `@cognitex/ui`, which formats with
 * `Number.isFinite` rather than `value || '--'`. That matters most here: an
 * OEE of zero is what an off-shift or stopped line legitimately reports, and
 * the old card rendered exactly that reading as "no data".
 *
 * The four cards this replaces also carried a hardcoded `trend="OPTIMO"` pill
 * that was green on every machine in every state.
 */

export interface ResumenViewProps {
    readings: readonly IndustryReading[];
    source: DataSource;
    updatedAt: number | null;
    sampleMs: number;
    days: number;
}

export function ResumenView({
    readings,
    source,
    updatedAt,
    sampleMs,
    days,
}: ResumenViewProps) {
    const generated = source === 'generated';

    const { metrics, trend, consistency, worstStop } = useMemo(() => {
        const oee = plantOee(readings, MACHINES, PRODUCTION_SHIFT);
        const plant = reliability(readings, { shift: PRODUCTION_SHIFT, sampleMs });
        const stops = downtimeEpisodes(readings, PRODUCTION_SHIFT);

        const idle = oee.scheduledSamples === 0;

        const cards: Metric[] = [
            {
                id: 'oee',
                label: 'OEE de planta',
                value: oee.reportedOee ?? Number.NaN,
                unit: '%',
                precision: 1,
                // 85% is the figure the industry calls world class.
                status: idle ? 'offline' : rank(oee.reportedOee ?? 0, 85, 65),
                trend: null,
            },
            {
                id: 'availability',
                label: 'Disponibilidad',
                value: oee.availability,
                unit: '%',
                precision: 1,
                status: idle ? 'offline' : rank(oee.availability, 90, 75),
                trend: null,
            },
            {
                id: 'performance',
                label: 'Rendimiento',
                value: oee.performance ?? Number.NaN,
                unit: '%',
                precision: 1,
                status: oee.performance === null ? 'offline' : rank(oee.performance, 95, 85),
                trend: null,
            },
            {
                id: 'quality',
                label: 'Calidad implícita',
                value: oee.impliedQuality ?? Number.NaN,
                unit: '%',
                precision: 1,
                status:
                    oee.impliedQuality === null
                        ? 'offline'
                        : oee.impliedQuality > 101
                          ? 'warning'
                          : rank(oee.impliedQuality, 98, 95),
                trend: null,
            },
            {
                id: 'stops',
                label: `Paradas · ${days} días`,
                value: plant.episodes,
                unit: '',
                precision: 0,
                // Zero stops is the best possible reading, and it renders.
                status: rank(plant.episodes, 2, 8, false),
                trend: null,
            },
            {
                id: 'mttr',
                label: 'MTTR',
                value: plant.mttrMs === null ? Number.NaN : plant.mttrMs / 3_600_000,
                unit: 'h',
                precision: 2,
                status:
                    plant.mttrMs === null
                        ? 'offline'
                        : rank(plant.mttrMs / 3_600_000, 1, 4, false),
                trend: null,
            },
        ];

        return {
            metrics: cards,
            trend: dailyOee(readings, PRODUCTION_SHIFT),
            consistency: oeeConsistency(oee),
            worstStop: [...stops].sort((a, b) => b.durationMs - a.durationMs).at(0) ?? null,
        };
    }, [readings, sampleMs, days]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-sm font-semibold text-ice">
                    Estado de planta · {MACHINES.length} máquinas
                </h2>
                <DataSourceBadge source={source} updatedAt={updatedAt} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {metrics.map((metric) => (
                    <MetricCard key={metric.id} metric={metric} generated={generated} />
                ))}
            </div>

            {consistency === 'inconsistente' && (
                <p role="alert" className="panel-raised p-4 text-sm text-warn">
                    El OEE reportado no se puede reconciliar con la telemetría: la
                    disponibilidad y la velocidad medidas no alcanzan para producirlo. Revise la
                    integración con el MES antes de usar la cifra en un informe.
                </p>
            )}

            <Section
                title="OEE diario"
                hint="Media por día sobre el turno programado. Los días sin producción programada no se dibujan."
            >
                <TimeSeriesChart
                    points={trend}
                    label="OEE de planta"
                    unit="%"
                    height={220}
                    band={{ low: 85, high: 100 }}
                />
            </Section>

            {worstStop && (
                <Section title="Parada más larga del periodo" hint="Dentro del turno programado.">
                    <p className="text-sm text-ice">
                        <span className="label-mono mr-2">{worstStop.assetId}</span>
                        {formatDuration(worstStop.durationMs)}
                        {!worstStop.resolved && (
                            <span className="ml-2 text-warn">· sin reanudación observada</span>
                        )}
                    </p>
                </Section>
            )}
        </div>
    );
}
