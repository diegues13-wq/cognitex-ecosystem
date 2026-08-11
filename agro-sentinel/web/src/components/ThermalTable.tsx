import { StatusDot } from '@cognitex/ui';
import type { Status } from '@cognitex/theme';

import { interpretScan } from '../domain';
import type { ThermalGrade, ThermalScan } from '../domain';
import { formatDateTime } from '../format';

/**
 * Thermal scans, graded on ΔT over ambient.
 *
 * The `simulado`/`sin verificar` column is the reason this table exists in
 * this shape. `cloud/thermal.py` writes an identical analysis for every image
 * it is handed — 42.5 °C, anomaly true — and records nothing about how the
 * number was produced. A table that showed those figures as measurements
 * would be the single most misleading thing in the console.
 */

export interface ThermalTableProps {
    scans: readonly ThermalScan[];
}

const GRADE_STATUS: Record<ThermalGrade, Status> = {
    unknown: 'offline',
    normal: 'ok',
    watch: 'warning',
    probable: 'warning',
    act: 'alert',
};

export function ThermalTable({ scans }: ThermalTableProps) {
    if (scans.length === 0) {
        return (
            <p className="py-6 text-center text-sm text-steel" role="status">
                No hay capturas térmicas para esta finca.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
                <caption className="sr-only">
                    Capturas térmicas de la finca, de la más reciente a la más antigua
                </caption>
                <thead>
                    <tr className="border-b border-steel/15 text-left">
                        <th scope="col" className="label-mono py-2 pr-3 font-normal">
                            Fecha
                        </th>
                        <th scope="col" className="label-mono py-2 pr-3 font-normal">
                            Máx.
                        </th>
                        <th scope="col" className="label-mono py-2 pr-3 font-normal">
                            ΔT
                        </th>
                        <th scope="col" className="label-mono py-2 pr-3 font-normal">
                            Lectura
                        </th>
                        <th scope="col" className="label-mono py-2 font-normal">
                            Origen
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {scans.map((scan) => {
                        const finding = interpretScan(scan);
                        return (
                            <tr key={scan.id} className="border-b border-steel/10 last:border-0">
                                <th scope="row" className="py-2.5 pr-3 text-left font-normal text-ice">
                                    <time dateTime={new Date(scan.at).toISOString()}>
                                        {formatDateTime(scan.at)}
                                    </time>
                                </th>
                                <td className="tabular py-2.5 pr-3">
                                    {Number.isFinite(scan.maxTemperature)
                                        ? `${scan.maxTemperature.toFixed(1)} °C`
                                        : '—'}
                                </td>
                                <td className="tabular py-2.5 pr-3 text-steel">
                                    {finding.delta === null
                                        ? '—'
                                        : `${finding.delta > 0 ? '+' : ''}${finding.delta.toFixed(1)} °C`}
                                </td>
                                <td className="py-2.5 pr-3">
                                    <span className="inline-flex items-center gap-2">
                                        <StatusDot status={GRADE_STATUS[finding.grade]} />
                                        <span className="text-steel">{finding.verdict}</span>
                                    </span>
                                </td>
                                <td className="py-2.5">
                                    {scan.stub ? (
                                        <span style={{ color: 'var(--color-warn)' }}>
                                            Sin verificar
                                        </span>
                                    ) : (
                                        <span className="text-steel">Simulado</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
