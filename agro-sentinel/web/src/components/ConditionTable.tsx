import { StatusDot } from '@cognitex/ui';

import { findChannel } from '../domain';
import type { AlarmCondition } from '../domain';
import { formatValue } from '../format';

/**
 * What is out of limits right now.
 *
 * Distinct from the alarm feed on purpose: the feed is the operational record
 * of alarms that were raised, acknowledged and cleared, while this is the
 * evaluation of the newest sample against the ISA-18.2 bands. A condition
 * that appears here and not in the feed means the alarm has already been
 * acknowledged; one in the feed and not here has returned to normal.
 */

export interface ConditionTableProps {
    conditions: readonly AlarmCondition[];
}

export function ConditionTable({ conditions }: ConditionTableProps) {
    if (conditions.length === 0) {
        return (
            <p className="py-4 text-center text-sm text-steel" role="status">
                Ningún canal fuera de límites en la última lectura.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-sm">
                <caption className="sr-only">
                    Canales fuera de límites en la última lectura, del más urgente al menos
                    urgente
                </caption>
                <thead>
                    <tr className="border-b border-steel/15 text-left">
                        <th scope="col" className="label-mono py-2 pr-3 font-normal">
                            Canal
                        </th>
                        <th scope="col" className="label-mono py-2 pr-3 font-normal">
                            Valor
                        </th>
                        <th scope="col" className="label-mono py-2 pr-3 font-normal">
                            Límite
                        </th>
                        <th scope="col" className="label-mono py-2 font-normal">
                            Nivel
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {conditions.map((condition) => {
                        const channel = findChannel(condition.channel);
                        return (
                            <tr
                                key={`${condition.channel}-${condition.level}-${condition.breach}`}
                                className="border-b border-steel/10 last:border-0"
                            >
                                <th scope="row" className="py-2.5 pr-3 text-left font-normal text-ice">
                                    {channel.label}
                                </th>
                                <td className="tabular py-2.5 pr-3">
                                    {formatValue(condition.value, channel)}
                                </td>
                                <td className="tabular py-2.5 pr-3 text-steel">
                                    {condition.breach === 'HIGH' ? 'máx.' : 'mín.'}{' '}
                                    {formatValue(condition.limit, channel)}
                                </td>
                                <td className="py-2.5">
                                    <span className="inline-flex items-center gap-2">
                                        <StatusDot
                                            status={
                                                condition.level === 'CRITICAL' ? 'alert' : 'warning'
                                            }
                                        />
                                        <span
                                            style={{
                                                color:
                                                    condition.level === 'CRITICAL'
                                                        ? 'var(--color-alert)'
                                                        : 'var(--color-warn)',
                                            }}
                                        >
                                            {condition.level === 'CRITICAL' ? 'Crítica' : 'Aviso'}
                                        </span>
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
