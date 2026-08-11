import { useMemo } from 'react';
import { DataSourceBadge, StatusDot } from '@cognitex/ui';
import type { DataSource, IndustryReading } from '@cognitex/data';

import {
    MACHINES,
    PRODUCTION_SHIFT,
    downtimeEpisodes,
    findMachine,
    formatDuration,
    rank,
    reliability,
    shiftHours,
    shortStamp,
    worstEpisodes,
    type Reliability,
} from '../domain';
import { Section } from '../components/Section';

/**
 * Availability, MTBF, MTTR and the stops behind them.
 *
 * This replaces two literal strings in the old sidebar — "Disponibilidad
 * 98.2%" and "Mantenimiento EN 150H" — which were the same for every machine
 * and were never computed from anything.
 */

export interface DisponibilidadViewProps {
    readings: readonly IndustryReading[];
    source: DataSource;
    updatedAt: number | null;
    sampleMs: number;
    days: number;
}

export function DisponibilidadView({
    readings,
    source,
    updatedAt,
    sampleMs,
    days,
}: DisponibilidadViewProps) {
    const { perMachine, stops } = useMemo(() => {
        const rows = MACHINES.map((machine) => ({
            machine,
            result: reliability(
                readings.filter((reading) => reading.assetId === machine.id),
                { shift: PRODUCTION_SHIFT, sampleMs }
            ),
        }));

        return {
            perMachine: rows,
            stops: worstEpisodes(downtimeEpisodes(readings, PRODUCTION_SHIFT), 15),
        };
    }, [readings, sampleMs]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-sm font-semibold text-ice">
                    Disponibilidad · turno {PRODUCTION_SHIFT.startHour}:00–
                    {PRODUCTION_SHIFT.endHour}:00 ({shiftHours(PRODUCTION_SHIFT)} h/día)
                </h2>
                <DataSourceBadge source={source} updatedAt={updatedAt} />
            </div>

            <Section
                title="Fiabilidad por máquina"
                hint={`Últimos ${days} días. El tiempo fuera de turno no cuenta como parada.`}
            >
                <div className="overflow-x-auto">
                    <table className="w-full min-w-160 border-collapse text-sm">
                        <caption className="sr-only">
                            Disponibilidad, paradas, MTBF y MTTR por máquina
                        </caption>
                        <thead>
                            <tr className="border-b border-steel/15">
                                <th scope="col" className="label-mono px-3 py-2 text-left">
                                    Máquina
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-right">
                                    Disponibilidad
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-right">
                                    Paradas
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-right">
                                    Tiempo perdido
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-right">
                                    MTBF
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-right">
                                    MTTR
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {perMachine.map(({ machine, result }) => (
                                <tr key={machine.id} className="border-b border-steel/10">
                                    <th
                                        scope="row"
                                        className="px-3 py-2.5 text-left font-normal text-ice"
                                    >
                                        <span className="flex items-center gap-2">
                                            <StatusDot status={statusOf(result)} />
                                            {machine.name}
                                        </span>
                                    </th>
                                    <td className="tabular px-3 py-2.5 text-right text-ice">
                                        {result.uptimeMs === 0 && result.episodes === 0
                                            ? '—'
                                            : `${result.availability.toFixed(1)} %`}
                                    </td>
                                    {/* Zero paradas is the best possible reading; it renders as 0. */}
                                    <td className="tabular px-3 py-2.5 text-right text-steel">
                                        {result.episodes}
                                    </td>
                                    <td className="tabular px-3 py-2.5 text-right text-steel">
                                        {formatDuration(result.downtimeMs)}
                                    </td>
                                    <td className="tabular px-3 py-2.5 text-right text-steel">
                                        {result.mtbfMs === null
                                            ? 'sin fallos'
                                            : formatDuration(result.mtbfMs)}
                                    </td>
                                    <td className="tabular px-3 py-2.5 text-right text-steel">
                                        {result.mttrMs === null
                                            ? 'sin fallos'
                                            : formatDuration(result.mttrMs)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>

            <Section
                title="Paradas más largas"
                hint="Cada parada se cierra en la lectura que reanudó la producción, no en la última lectura detenida."
            >
                {stops.length === 0 ? (
                    <p className="py-8 text-center text-sm text-steel">
                        Ninguna parada dentro del turno en el periodo.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-160 border-collapse text-sm">
                            <caption className="sr-only">
                                Paradas registradas, de la más larga a la más corta
                            </caption>
                            <thead>
                                <tr className="border-b border-steel/15">
                                    <th scope="col" className="label-mono px-3 py-2 text-left">
                                        Máquina
                                    </th>
                                    <th scope="col" className="label-mono px-3 py-2 text-left">
                                        Inicio
                                    </th>
                                    <th scope="col" className="label-mono px-3 py-2 text-left">
                                        Reanudación
                                    </th>
                                    <th scope="col" className="label-mono px-3 py-2 text-right">
                                        Duración
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {stops.map((stop) => (
                                    <tr
                                        key={`${stop.assetId}-${stop.from}`}
                                        className="border-b border-steel/10"
                                    >
                                        <th
                                            scope="row"
                                            className="px-3 py-2.5 text-left font-normal text-ice"
                                        >
                                            {findMachine(stop.assetId)?.name ?? stop.assetId}
                                        </th>
                                        <td className="px-3 py-2.5 whitespace-nowrap text-steel">
                                            {shortStamp(stop.from)}
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap text-steel">
                                            {stop.resolved ? (
                                                shortStamp(stop.to)
                                            ) : (
                                                <span style={{ color: 'var(--color-warn)' }}>
                                                    sin reanudación observada
                                                </span>
                                            )}
                                        </td>
                                        <td className="tabular px-3 py-2.5 text-right text-ice">
                                            {formatDuration(stop.durationMs)}
                                            {!stop.resolved && (
                                                <span className="text-steel"> (mínimo)</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Section>
        </div>
    );
}

function statusOf(result: Reliability) {
    if (result.uptimeMs === 0 && result.episodes === 0) return 'offline';
    return rank(result.availability, 90, 75);
}
