import { useMemo } from 'react';
import type { Metric } from '@cognitex/data';
import { MetricCard, TimeSeriesChart } from '@cognitex/ui';

import type { EnergyDay } from '../domain/types';
import { dayToMillis, toSeries } from '../domain/series';
import { Panel } from '../components/Panel';

/**
 * Traction energy and the emissions that follow from it.
 *
 * Electric and diesel consumption are different units, so they are different
 * charts. They are never drawn against two y-axes on one plot — the shape of
 * such a chart is set by the scaling, not by the data.
 */

function sum(rows: EnergyDay[], pick: (row: EnergyDay) => number): number {
    return rows.reduce((total, row) => total + pick(row), 0);
}

/** UIC reference band for specific electric traction energy, kWh per train-km. */
const UIC_SPECIFIC_KWH = { low: 6.67, high: 8.14 };

/** Industry reference band for diesel traction, litres per train-km. */
const DIESEL_SPECIFIC_L = { low: 2.3, high: 3.0 };

export interface EnergyViewProps {
    energy: EnergyDay[];
}

export default function EnergyView({ energy }: EnergyViewProps) {
    const totals = useMemo(
        () => ({
            kwh: sum(energy, (day) => day.kwhElectrico),
            diesel: sum(energy, (day) => day.litrosDiesel),
            co2: sum(energy, (day) => day.co2Kg),
            regen: sum(energy, (day) => day.kwhRegen),
        }),
        [energy]
    );

    const regenShare = totals.kwh > 0 ? (totals.regen / totals.kwh) * 100 : 0;

    const metrics: Metric[] = [
        {
            id: 'kwh',
            label: 'Energía eléctrica · 30 días',
            value: totals.kwh,
            unit: 'kWh',
            precision: 0,
            status: 'ok',
            trend: null,
        },
        {
            id: 'diesel',
            label: 'Diésel · 30 días',
            value: totals.diesel,
            unit: 'L',
            precision: 0,
            status: 'ok',
            trend: null,
        },
        {
            id: 'co2',
            label: 'CO₂ · 30 días',
            value: totals.co2,
            unit: 'kg',
            precision: 0,
            // A total with no target. The shared status vocabulary has no
            // neutral member, so this reports "ok" rather than colouring a
            // figure amber to imply a threshold that does not exist.
            status: 'ok',
            trend: null,
        },
        {
            id: 'regen',
            label: 'Recuperación regenerativa',
            value: regenShare,
            unit: '%',
            precision: 1,
            status: regenShare >= 10 ? 'ok' : 'warning',
            trend: null,
        },
    ];

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                    <MetricCard key={metric.id} metric={metric} />
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Consumo eléctrico — 30 días">
                    <TimeSeriesChart
                        points={toSeries(energy, (day) => dayToMillis(day.date), (day) => day.kwhElectrico)}
                        label="Energía eléctrica de tracción por día"
                        unit="kWh"
                        height={190}
                    />
                </Panel>

                <Panel title="Consumo de diésel — 30 días">
                    <TimeSeriesChart
                        points={toSeries(energy, (day) => dayToMillis(day.date), (day) => day.litrosDiesel)}
                        label="Diésel consumido por día"
                        unit="L"
                        height={190}
                    />
                </Panel>

                <Panel title="Coste energético — 30 días">
                    <TimeSeriesChart
                        points={toSeries(energy, (day) => dayToMillis(day.date), (day) => day.costEnergiaUSD)}
                        label="Coste de energía por día"
                        unit="USD"
                        height={190}
                    />
                </Panel>

                <Panel title="Emisiones de CO₂ — 30 días">
                    <TimeSeriesChart
                        points={toSeries(energy, (day) => dayToMillis(day.date), (day) => day.co2Kg)}
                        label="CO₂ emitido por día"
                        unit="kg"
                        height={190}
                    />
                    <p className="mt-2 text-xs text-steel">
                        Solo tracción diésel, con el factor 2,68 kg de CO₂ por litro. La tracción
                        eléctrica se contabiliza en el mix de la red, no aquí.
                    </p>
                </Panel>

                <Panel title="Intensidad eléctrica — 30 días">
                    <TimeSeriesChart
                        points={toSeries(energy, (day) => dayToMillis(day.date), (day) => day.specifickWhKm)}
                        label="Energía específica por tren-kilómetro"
                        unit="kWh/tren-km"
                        height={190}
                        band={UIC_SPECIFIC_KWH}
                    />
                    <p className="mt-2 text-xs text-steel">
                        La banda es el rango de referencia UIC ({UIC_SPECIFIC_KWH.low}–
                        {UIC_SPECIFIC_KWH.high} kWh por tren-km). Por debajo del rango conviene
                        verificar la medición antes de celebrarlo.
                    </p>
                </Panel>

                <Panel title="Intensidad diésel — 30 días">
                    <TimeSeriesChart
                        points={toSeries(energy, (day) => dayToMillis(day.date), (day) => day.specificLKm)}
                        label="Consumo específico de diésel por tren-kilómetro"
                        unit="L/tren-km"
                        height={190}
                        band={DIESEL_SPECIFIC_L}
                    />
                    <p className="mt-2 text-xs text-steel">
                        Referencia del sector: {DIESEL_SPECIFIC_L.low}–{DIESEL_SPECIFIC_L.high}{' '}
                        litros por tren-km para composiciones equivalentes.
                    </p>
                </Panel>
            </div>
        </div>
    );
}
