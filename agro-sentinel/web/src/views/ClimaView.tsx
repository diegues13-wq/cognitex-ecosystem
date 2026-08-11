import { useMemo } from 'react';
import { DataSourceBadge, MetricCard, StatusDot } from '@cognitex/ui';
import type { DataSource, Metric } from '@cognitex/data';

import {
    CHANNELS,
    CLIMATE_CHANNELS,
    botrytisRisk,
    channelStatus,
    condensationMargin,
    dailyLightIntegral,
    dewPoint,
    findChannel,
    growingDegreeDays,
    latestSample,
    trendOf,
} from '../domain';
import type { Farm, GreenhouseSample } from '../domain';
import { Section } from '../components/Section';
import { ChannelChart } from '../components/ChannelChart';
import { formatAge } from '../format';

/**
 * The state of the greenhouse, in numbers.
 *
 * Every card is a `MetricCard` from `@cognitex/ui`. The six bespoke cards this
 * replaces each carried their own colour literal, their own threshold pair and
 * `val ?? '--'` — so PAR at night, which is 0, displayed as "no data" every
 * night, and a soil probe reading 0% looked identical to a soil probe that had
 * fallen out of its socket.
 */

export interface ClimaViewProps {
    farm: Farm;
    samples: readonly GreenhouseSample[];
    source: DataSource;
    updatedAt: number | null;
    now: number;
}

const DEVICE_CHANNELS = CHANNELS.filter(
    (channel) => channel.id === 'batteryPct' || channel.id === 'rssiDbm'
);

export function ClimaView({ farm, samples, source, updatedAt, now }: ClimaViewProps) {
    const generated = source === 'generated';
    const latest = useMemo(() => latestSample(samples), [samples]);

    const metrics = useMemo<Metric[]>(
        () =>
            [...CLIMATE_CHANNELS, ...DEVICE_CHANNELS].map((channel) => {
                const raw = latest?.[channel.id];
                const value = typeof raw === 'number' ? raw : Number.NaN;

                return {
                    id: channel.id,
                    label: channel.short,
                    value,
                    unit: channel.unit,
                    precision: channel.precision,
                    status: channelStatus(channel.id, Number.isFinite(value) ? value : null),
                    // Only where a rise is an improvement. `MetricCard` paints
                    // any positive trend green and any negative one red, with
                    // no way to say otherwise — so a temperature climbing 8%
                    // towards its critical limit would render as good news.
                    // Reported against @cognitex/ui; until it takes a
                    // direction, the honest option is no arrow rather than a
                    // green one.
                    trend: channel.higherIsBetter ? trendOf(samples, channel.id) : null,
                };
            }),
        [latest, samples]
    );

    const agronomy = useMemo(() => {
        const gdd = growingDegreeDays(samples);
        const dli = dailyLightIntegral(samples);
        const risk = botrytisRisk(latest?.airTemperature ?? null, latest?.humidity ?? null);
        const td =
            latest === null ? null : dewPoint(latest.airTemperature, latest.humidity);
        const margin =
            latest === null ? null : condensationMargin(latest.airTemperature, latest.humidity);

        return { gdd, dli, risk, td, margin };
    }, [samples, latest]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="font-display text-sm font-semibold text-ice">
                        {farm.name} · {farm.crop} · {farm.hectares} ha
                    </h2>
                    <p className="mt-0.5 text-xs text-steel">
                        {latest
                            ? `Última lectura ${formatAge(latest.at, now)}`
                            : 'Sin lecturas en el periodo'}
                    </p>
                </div>
                <DataSourceBadge source={source} updatedAt={updatedAt} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                    <MetricCard key={metric.id} metric={metric} generated={generated} />
                ))}
            </div>

            <Section
                title="Agronomía"
                hint="Grados-día base 10 °C (McMaster & Wilhelm, método 1), integral diaria de luz y presión de Botrytis sobre la ventana cargada."
            >
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                        <dt className="label-mono">Grados-día acumulados</dt>
                        <dd className="tabular mt-1 text-lg text-ice">
                            {agronomy.gdd.days.length === 0
                                ? '—'
                                : `${agronomy.gdd.total.toFixed(1)} °día`}
                            <span className="ml-2 text-xs text-steel">
                                {agronomy.gdd.days.length} día(s), base {agronomy.gdd.base} °C
                            </span>
                        </dd>
                    </div>
                    <div>
                        <dt className="label-mono">Integral diaria de luz</dt>
                        <dd className="tabular mt-1 text-lg text-ice">
                            {agronomy.dli.days.length === 0
                                ? '—'
                                : `${agronomy.dli.mean.toFixed(1)} mol/m²·día`}
                            <span className="ml-2 text-xs text-steel">promedio</span>
                        </dd>
                    </div>
                    <div>
                        <dt className="label-mono">Punto de rocío</dt>
                        <dd className="tabular mt-1 text-lg text-ice">
                            {agronomy.td === null ? '—' : `${agronomy.td.toFixed(1)} °C`}
                            {agronomy.margin !== null && (
                                <span className="ml-2 text-xs text-steel">
                                    margen {agronomy.margin.toFixed(1)} °C
                                </span>
                            )}
                        </dd>
                    </div>
                </dl>

                <p className="mt-4 flex items-center gap-2 border-t border-steel/15 pt-4 text-sm">
                    <StatusDot
                        status={
                            agronomy.risk.level === 'HIGH'
                                ? 'alert'
                                : agronomy.risk.level === 'MEDIUM'
                                  ? 'warning'
                                  : 'ok'
                        }
                    />
                    <span className="text-ice">Riesgo de Botrytis: {agronomy.risk.level}</span>
                    <span className="text-steel">— {agronomy.risk.reason}</span>
                </p>
            </Section>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {(['airTemperature', 'humidity', 'vpd', 'co2'] as const).map((id) => {
                    const channel = findChannel(id);
                    return (
                        <Section key={id} title={channel.label}>
                            <ChannelChart samples={samples} channel={channel} height={190} />
                        </Section>
                    );
                })}
            </div>
        </div>
    );
}
