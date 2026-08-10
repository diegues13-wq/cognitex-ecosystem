import { useId, useMemo, useState, type ReactNode } from 'react';

import {
    ROOT_CAUSES,
    detectRecurrence,
    type AdjustmentStatus,
    type FailureEntry,
    type RootCause,
} from '../domain';
import { Section } from './Section';

/**
 * The log.
 *
 * The recurrence column now reads a derived flag rather than a stored one, so
 * a row marked "Recurrente" can be checked against the rows above it — the
 * previous table rendered whatever boolean the generator happened to write,
 * including on entries the user had typed themselves, where it was always
 * false.
 *
 * Status is text, not a bare coloured icon. `<Check/>` in green and `<X/>` in
 * red carried the entire meaning of the column and neither had a label.
 */

export interface EntryTableProps {
    entries: readonly FailureEntry[];
    max?: number;
    aside?: ReactNode;
}

const STATUS_LABEL: Record<AdjustmentStatus, string> = {
    pendiente: 'Pendiente',
    si: 'Implementado',
    parcial: 'Parcial',
    no: 'No implementado',
};

const STATUS_TOKEN: Record<AdjustmentStatus, string> = {
    pendiente: 'var(--color-steel)',
    si: 'var(--color-ok)',
    parcial: 'var(--color-warn)',
    no: 'var(--color-alert)',
};

export function EntryTable({ entries, max = 60, aside }: EntryTableProps) {
    const filterId = useId();
    const [filter, setFilter] = useState<RootCause | ''>('');

    const rows = useMemo(() => {
        const flagged = detectRecurrence(entries);
        return flagged
            .filter((entry) => filter === '' || entry.rootCause === filter)
            .sort((a, b) => b.at - a.at)
            .slice(0, max);
    }, [entries, filter, max]);

    const present = useMemo(
        () => [...new Set(entries.map((entry) => entry.rootCause))],
        [entries]
    );

    return (
        <Section
            title="Bitácora de fallos"
            hint={`${rows.length} de ${entries.length} registros`}
            aside={
                <div className="flex items-center gap-2">
                    {aside}
                    <label htmlFor={filterId} className="sr-only">
                        Filtrar por causa raíz
                    </label>
                    <select
                        id={filterId}
                        value={filter}
                        onChange={(event) => setFilter(event.target.value as RootCause | '')}
                        className="min-h-11 rounded-lg border border-steel/25 bg-navy-900 px-3 text-sm text-ice outline-none focus:border-[var(--color-brand)]"
                    >
                        <option value="">Todas las causas</option>
                        {present.map((cause) => (
                            <option key={cause} value={cause}>
                                {ROOT_CAUSES[cause].label}
                            </option>
                        ))}
                    </select>
                </div>
            }
        >
            {rows.length === 0 ? (
                <p className="py-8 text-center text-sm text-steel">
                    No hay registros para el filtro seleccionado.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-160 border-collapse text-sm">
                        <caption className="sr-only">
                            Fallos registrados, del más reciente al más antiguo
                        </caption>
                        <thead>
                            <tr className="border-b border-steel/15">
                                <th scope="col" className="label-mono px-3 py-2 text-left">
                                    Fecha
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-left">
                                    Fallo
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-left">
                                    Causa raíz
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-left">
                                    Ajuste
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-left">
                                    Repetición
                                </th>
                                <th scope="col" className="label-mono px-3 py-2 text-left">
                                    Verificación
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((entry) => (
                                <tr key={entry.id} className="border-b border-steel/10 align-top">
                                    <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap text-steel">
                                        {entry.date}
                                    </td>
                                    <td className="max-w-64 px-3 py-2.5 text-ice">
                                        {entry.failure}
                                    </td>
                                    <td className="px-3 py-2.5 whitespace-nowrap text-steel">
                                        {ROOT_CAUSES[entry.rootCause].short}
                                    </td>
                                    <td className="max-w-64 px-3 py-2.5 text-steel">
                                        {entry.adjustment}
                                    </td>
                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                        {entry.recurring ? (
                                            <span style={{ color: 'var(--color-warn)' }}>
                                                Recurrente
                                                {entry.daysSincePrevious !== null && (
                                                    <span className="text-steel">
                                                        {' '}
                                                        · {entry.daysSincePrevious} d
                                                    </span>
                                                )}
                                            </span>
                                        ) : (
                                            <span className="text-steel">Nuevo</span>
                                        )}
                                    </td>
                                    <td
                                        className="px-3 py-2.5 whitespace-nowrap"
                                        style={{ color: STATUS_TOKEN[entry.adjustmentStatus] }}
                                    >
                                        {STATUS_LABEL[entry.adjustmentStatus]}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Section>
    );
}
