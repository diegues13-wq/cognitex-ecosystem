import type { ParetoRow } from '../domain';

/**
 * The Pareto, as a ranked table with proportional bars.
 *
 * No charting library — recharts came out of transport-sentinel to stop a
 * SIGILL crash and is banned everywhere. A bar chart of seven ranked
 * categories is a table with a width per row, so that is what this is: the
 * numbers are readable directly, it is navigable by screen reader, and it
 * needs no library at all.
 *
 * Colour encodes the analysis rather than identity. The vital few — the
 * causes that together explain 80% of failures — carry the brand accent;
 * everything else is steel. The old chart gave each cause its own hardcoded
 * hue from a palette that matched nothing else in the console, which meant the
 * colour said only "this is a different cause", something the label already
 * said.
 */

export interface ParetoTableProps {
    rows: readonly ParetoRow[];
}

export function ParetoTable({ rows }: ParetoTableProps) {
    if (rows.length === 0) {
        return <p className="py-8 text-center text-sm text-steel">Sin fallos en el periodo.</p>;
    }

    const peak = rows[0]?.count ?? 1;

    return (
        <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
                Causas raíz ordenadas por frecuencia, con porcentaje acumulado
            </caption>
            <thead>
                <tr className="border-b border-steel/15">
                    <th scope="col" className="label-mono px-2 py-2 text-left">
                        Causa raíz
                    </th>
                    <th scope="col" className="label-mono px-2 py-2 text-right">
                        Fallos
                    </th>
                    <th scope="col" className="label-mono px-2 py-2 text-right">
                        %
                    </th>
                    <th scope="col" className="label-mono px-2 py-2 text-right">
                        Acum.
                    </th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr key={row.cause} className="border-b border-steel/10">
                        <th scope="row" className="px-2 py-2.5 text-left font-normal">
                            <span className="flex items-center gap-2">
                                <span className={row.vital ? 'text-ice' : 'text-steel'}>
                                    {row.label}
                                </span>
                                {row.vital && (
                                    <span
                                        className="rounded-full border px-1.5 py-px text-[0.625rem]"
                                        style={{
                                            borderColor:
                                                'color-mix(in srgb, var(--color-brand) 45%, transparent)',
                                            color: 'var(--color-brand)',
                                        }}
                                    >
                                        vital
                                    </span>
                                )}
                            </span>
                            <span
                                className="mt-1.5 block h-1.5 rounded-full"
                                style={{
                                    width: `${(row.count / peak) * 100}%`,
                                    backgroundColor: row.vital
                                        ? 'var(--color-brand)'
                                        : 'color-mix(in srgb, var(--color-steel) 55%, transparent)',
                                }}
                                aria-hidden="true"
                            />
                        </th>
                        <td className="px-2 py-2.5 text-right tabular text-ice">{row.count}</td>
                        <td className="px-2 py-2.5 text-right tabular text-steel">
                            {row.share.toFixed(1)}
                        </td>
                        <td
                            className="px-2 py-2.5 text-right tabular"
                            style={{ color: row.vital ? 'var(--color-brand)' : 'var(--color-steel)' }}
                        >
                            {row.cumulative.toFixed(1)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
