import { useId, useMemo, useState } from 'react';
import { DataSourceBadge } from '@cognitex/ui';
import type { DataSource } from '@cognitex/data';

import { CHANNELS, dailyTemperature, findChannel, statsFor } from '../domain';
import type { ChannelId, GreenhouseSample } from '../domain';
import { Section } from '../components/Section';
import { ChannelChart } from '../components/ChannelChart';
import { formatDate, formatDateTime, formatValue } from '../format';

/**
 * One channel, over the loaded window, with its statistics.
 *
 * This is what the old console's `selectedVariable` string was really for: a
 * seven-way switch in the sidebar that swapped the contents of the same
 * `<div>` and called it navigation. It is a section now, and the channel is a
 * labelled `<select>` inside it, so the browser's back button, the URL and the
 * shell's own section list all mean what they say.
 */

export interface HistorialViewProps {
    samples: readonly GreenhouseSample[];
    source: DataSource;
    updatedAt: number | null;
}

export function HistorialView({ samples, source, updatedAt }: HistorialViewProps) {
    const selectId = useId();
    const [channelId, setChannelId] = useState<ChannelId>('airTemperature');
    const channel = findChannel(channelId);

    const stats = useMemo(() => statsFor(samples, channelId), [samples, channelId]);
    const days = useMemo(() => dailyTemperature(samples), [samples]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-ice">
                        Canal
                    </label>
                    <select
                        id={selectId}
                        value={channelId}
                        onChange={(event) => setChannelId(event.target.value as ChannelId)}
                        className="min-h-11 rounded-lg border border-steel/25 bg-navy-800 px-3 text-sm text-ice outline-none focus:border-[var(--color-brand)]"
                    >
                        {CHANNELS.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                <DataSourceBadge source={source} updatedAt={updatedAt} />
            </div>

            <Section
                title={channel.label}
                hint="La banda verde es el rango recomendado del canal; fuera de ella el sistema levanta un aviso."
            >
                <ChannelChart samples={samples} channel={channel} height={260} maxPoints={360} />
            </Section>

            <Section title="Resumen del periodo">
                {stats === null ? (
                    <p className="py-4 text-center text-sm text-steel" role="status">
                        Sin lecturas de {channel.label.toLowerCase()} en el periodo.
                    </p>
                ) : (
                    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div>
                            <dt className="label-mono">Mínimo</dt>
                            <dd className="tabular mt-1 text-ice">
                                {formatValue(stats.min, channel)}
                            </dd>
                            <dd className="text-xs text-steel">{formatDateTime(stats.minAt)}</dd>
                        </div>
                        <div>
                            <dt className="label-mono">Máximo</dt>
                            <dd className="tabular mt-1 text-ice">
                                {formatValue(stats.max, channel)}
                            </dd>
                            <dd className="text-xs text-steel">{formatDateTime(stats.maxAt)}</dd>
                        </div>
                        <div>
                            <dt className="label-mono">Promedio</dt>
                            <dd className="tabular mt-1 text-ice">
                                {formatValue(stats.mean, channel)}
                            </dd>
                            <dd className="text-xs text-steel">{stats.count} lecturas</dd>
                        </div>
                        <div>
                            <dt className="label-mono">Última</dt>
                            <dd className="tabular mt-1 text-ice">
                                {formatValue(stats.latest, channel)}
                            </dd>
                            <dd className="text-xs text-steel">{formatDateTime(stats.latestAt)}</dd>
                        </div>
                    </dl>
                )}
            </Section>

            <Section
                title="Temperatura por día"
                hint="Mínima, máxima y media de cada día en hora de Ecuador. Los días sin lecturas no aparecen."
            >
                {days.length === 0 ? (
                    <p className="py-4 text-center text-sm text-steel" role="status">
                        Sin lecturas en el periodo.
                    </p>
                ) : (
                    <div className="max-h-96 overflow-auto">
                        <table className="w-full min-w-[28rem] border-collapse text-sm">
                            <caption className="sr-only">
                                Temperatura mínima, máxima y media por día
                            </caption>
                            <thead>
                                <tr className="border-b border-steel/15 text-left">
                                    <th scope="col" className="label-mono py-2 pr-3 font-normal">
                                        Día
                                    </th>
                                    <th scope="col" className="label-mono py-2 pr-3 font-normal">
                                        Mín.
                                    </th>
                                    <th scope="col" className="label-mono py-2 pr-3 font-normal">
                                        Máx.
                                    </th>
                                    <th scope="col" className="label-mono py-2 pr-3 font-normal">
                                        Media
                                    </th>
                                    <th scope="col" className="label-mono py-2 font-normal">
                                        Lecturas
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...days].reverse().map((day) => (
                                    <tr
                                        key={day.day}
                                        className="border-b border-steel/10 last:border-0"
                                    >
                                        <th
                                            scope="row"
                                            className="py-2 pr-3 text-left font-normal text-ice"
                                        >
                                            {formatDate(day.start)}
                                        </th>
                                        <td className="tabular py-2 pr-3">{day.min.toFixed(1)} °C</td>
                                        <td className="tabular py-2 pr-3">{day.max.toFixed(1)} °C</td>
                                        <td className="tabular py-2 pr-3">
                                            {day.mean.toFixed(1)} °C
                                        </td>
                                        <td className="tabular py-2 text-steel">{day.count}</td>
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
