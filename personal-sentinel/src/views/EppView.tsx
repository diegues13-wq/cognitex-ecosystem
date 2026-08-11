import { useMemo } from 'react';
import { DataSourceBadge, StatusDot } from '@cognitex/ui';
import type { DataSource, PersonalReading } from '@cognitex/data';

import {
    PPE_LABEL,
    STALE_AFTER_MS,
    WORKERS,
    formatDuration,
    ppeCompliance,
    ppeStatuses,
    shortStamp,
    wearableCoverage,
} from '../domain';
import { Section } from '../components/Section';

/**
 * PPE, and how much of it the platform can honestly claim to have checked.
 *
 * The sidebar this replaces read "Casco Smart · CONECTADO" and "Chaleco · BATT
 * 85%" as literal strings in the markup, for every worker, always — two green
 * badges asserting a measurement nobody had taken.
 *
 * Only the smart helmet reports, so exactly one item per worker can be
 * verified. The rest say `declarado` and carry no tick. That is the same
 * promise `DataSourceBadge` makes about the numbers, applied to compliance:
 * we say when we are not measuring.
 */

export interface EppViewProps {
    readings: readonly PersonalReading[];
    source: DataSource;
    updatedAt: number | null;
    now: number;
}

export function EppView({ readings, source, updatedAt, now }: EppViewProps) {
    const rows = useMemo(
        () =>
            WORKERS.map((worker) => {
                const coverage = wearableCoverage(readings, worker, now);
                const statuses = ppeStatuses(worker, coverage);
                return { worker, coverage, statuses, compliance: ppeCompliance(statuses) };
            }),
        [readings, now]
    );

    const verifiable = rows.reduce((sum, row) => sum + row.compliance.verifiable, 0);
    const required = rows.reduce((sum, row) => sum + row.compliance.required, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-sm font-semibold text-ice">
                    Equipo de protección personal
                </h2>
                <DataSourceBadge source={source} updatedAt={updatedAt} />
            </div>

            <p className="panel-raised p-4 text-sm text-steel">
                De {required} elementos requeridos por la cuadrilla, la plataforma puede
                verificar {verifiable}: el casco inteligente es el único con telemetría. Los
                demás se declaran en el ingreso y aquí aparecen sin marca, no como incumplidos.
            </p>

            <Section
                title="Cobertura del wearable"
                hint={`Un casco que lleva más de ${formatDuration(STALE_AFTER_MS)} sin reportar cuenta como fuera de línea: una caída que no puede transmitir es una caída que nadie oye.`}
            >
                <div className="overflow-x-auto">
                    <table className="w-full min-w-160 border-collapse text-sm">
                        <caption className="sr-only">
                            Estado del casco inteligente y cumplimiento verificable por trabajador
                        </caption>
                        <thead>
                            <tr className="border-b border-steel/15">
                                <th scope="col" className="label-mono px-3 py-2 text-left">
                                    Trabajador
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-left">
                                    Casco
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-right">
                                    Batería
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-left">
                                    Última señal
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-right">
                                    Verificable
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-right">
                                    Cumplimiento
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(({ worker, coverage, compliance }) => (
                                <tr key={worker.id} className="border-b border-steel/10">
                                    <th
                                        scope="row"
                                        className="px-3 py-2.5 text-left font-normal text-ice"
                                    >
                                        <span className="flex items-center gap-2">
                                            <StatusDot status={coverage.status} />
                                            {worker.name}
                                        </span>
                                    </th>
                                    <td className="px-3 py-2.5 text-steel">
                                        {coverage.lastSeen === null
                                            ? 'Nunca ha reportado'
                                            : coverage.stale
                                              ? 'En silencio'
                                              : 'Reportando'}
                                    </td>
                                    <td className="tabular px-3 py-2.5 text-right text-steel">
                                        {coverage.battery === null
                                            ? '—'
                                            : `${coverage.battery} %`}
                                    </td>
                                    <td className="px-3 py-2.5 whitespace-nowrap text-steel">
                                        {coverage.lastSeen === null
                                            ? '—'
                                            : shortStamp(coverage.lastSeen)}
                                    </td>
                                    <td className="tabular px-3 py-2.5 text-right text-steel">
                                        {compliance.verifiable} de {compliance.required}
                                    </td>
                                    <td className="tabular px-3 py-2.5 text-right text-ice">
                                        {compliance.rate === null
                                            ? 'sin verificar'
                                            : `${compliance.rate.toFixed(0)} %`}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>

            {rows.map(({ worker, statuses }) => (
                <Section
                    key={worker.id}
                    title={worker.name}
                    hint={`${worker.area} · ${statuses.length} elementos requeridos`}
                >
                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {statuses.map((status) => (
                            <li
                                key={status.item}
                                className="panel-raised flex items-start justify-between gap-3 p-3"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm text-ice">{PPE_LABEL[status.item]}</p>
                                    <p className="mt-0.5 text-xs text-steel">{status.note}</p>
                                </div>
                                <span
                                    className="shrink-0 text-xs"
                                    style={{
                                        color:
                                            status.compliant === true
                                                ? 'var(--color-ok)'
                                                : status.compliant === false
                                                  ? 'var(--color-alert)'
                                                  : 'var(--color-steel)',
                                    }}
                                >
                                    {status.compliant === true
                                        ? 'Verificado'
                                        : status.compliant === false
                                          ? 'Sin señal'
                                          : 'Declarado'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </Section>
            ))}
        </div>
    );
}
