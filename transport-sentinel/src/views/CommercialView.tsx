import { useMemo } from 'react';
import type { Metric } from '@cognitex/data';
import { MetricCard, TimeSeriesChart } from '@cognitex/ui';

import type { CargoDay, FleetFilter, FleetKpis, PassengerDay } from '../domain/types';
import { dayToMillis, toSeries } from '../domain/series';
import { Panel } from '../components/Panel';

/**
 * Demand and revenue, passenger and freight.
 *
 * The fleet filter in the toolbar decides which half is on screen, so a
 * freight operator is not shown thirty days of seat occupancy.
 */

function sum<T>(rows: T[], pick: (row: T) => number): number {
    return rows.reduce((total, row) => total + pick(row), 0);
}

export interface CommercialViewProps {
    passengers: PassengerDay[];
    cargo: CargoDay[];
    kpis: FleetKpis;
    fleetFilter: FleetFilter;
}

export default function CommercialView({
    passengers,
    cargo,
    kpis,
    fleetFilter,
}: CommercialViewProps) {
    const showPassengers = fleetFilter !== 'carga';
    const showCargo = fleetFilter !== 'pasajeros';

    const metrics: Metric[] = useMemo(() => {
        const rows: Metric[] = [];

        if (showPassengers) {
            rows.push(
                {
                    id: 'pax',
                    label: 'Pasajeros · 30 días',
                    value: sum(passengers, (day) => day.pasajeros),
                    unit: '',
                    precision: 0,
                    status: 'ok',
                    trend: null,
                },
                {
                    id: 'load-factor',
                    label: 'Factor de carga actual',
                    value: kpis.factorCarga,
                    unit: '%',
                    precision: 0,
                    status: kpis.factorCarga >= 60 ? 'ok' : 'warning',
                    trend: null,
                }
            );
        }

        if (showCargo) {
            rows.push(
                {
                    id: 'tons',
                    label: 'Toneladas · 30 días',
                    value: sum(cargo, (day) => day.toneladas),
                    unit: 't',
                    precision: 0,
                    status: 'ok',
                    trend: null,
                },
                {
                    id: 'cargo-revenue',
                    label: 'Ingreso carga · 30 días',
                    value: sum(cargo, (day) => day.ingresoUSD),
                    unit: 'USD',
                    precision: 0,
                    status: 'ok',
                    trend: null,
                }
            );
        }

        return rows;
    }, [cargo, kpis.factorCarga, passengers, showCargo, showPassengers]);

    /**
     * Revenue and cost are two series with the same unit, so they belong on
     * one axis. Margin is the number the commercial team actually reads, and
     * a single line makes a bad day visible instead of leaving it to be
     * inferred from the gap between two curves.
     */
    const margin = useMemo(() => {
        const rows: (PassengerDay | CargoDay)[] =
            showPassengers && passengers.length > 0 ? passengers : cargo;
        return toSeries(
            rows,
            (day) => dayToMillis(day.date),
            (day) => day.ingresoUSD - day.costoOperUSD
        );
    }, [cargo, passengers, showPassengers]);

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                    <MetricCard key={metric.id} metric={metric} />
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {showPassengers && (
                    <>
                        <Panel title="Pasajeros diarios — 30 días">
                            <TimeSeriesChart
                                points={toSeries(passengers, (day) => dayToMillis(day.date), (day) => day.pasajeros)}
                                label="Pasajeros transportados por día"
                                unit="pax"
                                height={190}
                            />
                        </Panel>

                        <Panel title="Factor de carga — 30 días">
                            <TimeSeriesChart
                                points={toSeries(passengers, (day) => dayToMillis(day.date), (day) => day.factorCarga)}
                                label="Factor de carga diario"
                                unit="%"
                                height={190}
                                band={{ low: 60, high: 100 }}
                            />
                            <p className="mt-2 text-xs text-steel">
                                Por debajo del 60 % el servicio no cubre su coste variable en la
                                mayoría de las rutas de pasajeros de la red.
                            </p>
                        </Panel>
                    </>
                )}

                {showCargo && (
                    <>
                        <Panel title="Toneladas transportadas — 30 días">
                            <TimeSeriesChart
                                points={toSeries(cargo, (day) => dayToMillis(day.date), (day) => day.toneladas)}
                                label="Toneladas por día"
                                unit="t"
                                height={190}
                            />
                        </Panel>

                        <Panel title="Entregas a tiempo — 30 días">
                            <TimeSeriesChart
                                points={toSeries(cargo, (day) => dayToMillis(day.date), (day) => day.entregasATiempo)}
                                label="Porcentaje de entregas a tiempo"
                                unit="%"
                                height={190}
                                band={{ low: 90, high: 100 }}
                            />
                        </Panel>
                    </>
                )}

                <Panel title="Margen diario — 30 días">
                    <TimeSeriesChart
                        points={margin}
                        label="Ingreso menos coste operativo por día"
                        unit="USD"
                        height={190}
                    />
                    <p className="mt-2 text-xs text-steel">
                        Ingreso menos coste operativo del segmento en pantalla. Un solo eje: las
                        dos series comparten unidad y la diferencia es lo que se decide.
                    </p>
                </Panel>
            </div>
        </div>
    );
}
