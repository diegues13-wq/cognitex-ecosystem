import { DataSourceBadge, StatusDot } from '@cognitex/ui';
import type { DataSource } from '@cognitex/data';

import { FARMS } from '../domain';
import type { Farm, GreenhouseSample } from '../domain';
import { Section } from '../components/Section';
import { formatValue } from '../format';
import { findChannel } from '../domain';

/**
 * The five farms.
 *
 * This is what the Leaflet map became. The map was a `react-leaflet@5.0.0-rc.2`
 * — a release candidate, in a deployed console — plus `leaflet`, its CSS, two
 * PNG marker sprites imported through the bundler and a runtime tile fetch
 * from a third-party CDN, all to place five fixed points on a country. The
 * points never moved and the map answered no question the operator had; a
 * table answers "which farm, which crop, what state" in a form that also
 * works on a screen reader, on a slow link and behind a packing-shed firewall.
 *
 * The coordinates are still here, and each row links out to a map for anyone
 * who wants one — as a link, not as 200 KB of runtime.
 */

export interface FincasViewProps {
    selectedId: string;
    onSelect: (id: string) => void;
    /** The selected farm's newest sample, for the status column. */
    latest: GreenhouseSample | null;
    source: DataSource;
    updatedAt: number | null;
}

const REGION_LABEL: Record<Farm['region'], string> = {
    SIERRA: 'Sierra',
    COSTA: 'Costa',
    AMAZONIA: 'Amazonía',
};

export function FincasView({
    selectedId,
    onSelect,
    latest,
    source,
    updatedAt,
}: FincasViewProps) {
    const temperature = findChannel('airTemperature');
    const humidity = findChannel('humidity');

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-sm font-semibold text-ice">Fincas monitorizadas</h2>
                <DataSourceBadge source={source} updatedAt={updatedAt} />
            </div>

            <Section
                title="Red de invernaderos"
                hint="Los identificadores son los que valida la función de ingesta en la nube. Solo la finca seleccionada tiene lecturas cargadas."
            >
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[44rem] border-collapse text-sm">
                        <caption className="sr-only">
                            Fincas, cultivo, ubicación y estado de la finca seleccionada
                        </caption>
                        <thead>
                            <tr className="border-b border-steel/15 text-left">
                                <th scope="col" className="label-mono py-2 pr-3 font-normal">
                                    Finca
                                </th>
                                <th scope="col" className="label-mono py-2 pr-3 font-normal">
                                    Identificador
                                </th>
                                <th scope="col" className="label-mono py-2 pr-3 font-normal">
                                    Cultivo
                                </th>
                                <th scope="col" className="label-mono py-2 pr-3 font-normal">
                                    Región
                                </th>
                                <th scope="col" className="label-mono py-2 pr-3 font-normal">
                                    Altitud
                                </th>
                                <th scope="col" className="label-mono py-2 font-normal">
                                    Estado
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {FARMS.map((farm) => {
                                const selected = farm.id === selectedId;
                                return (
                                    <tr
                                        key={farm.id}
                                        className="border-b border-steel/10 last:border-0"
                                    >
                                        <th
                                            scope="row"
                                            className="py-2.5 pr-3 text-left font-normal"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => onSelect(farm.id)}
                                                aria-current={selected ? 'true' : undefined}
                                                className="min-h-9 text-left text-ice underline-offset-4 hover:underline"
                                                style={
                                                    selected
                                                        ? { color: 'var(--color-brand)' }
                                                        : undefined
                                                }
                                            >
                                                {farm.name}
                                                <span className="sr-only">
                                                    {selected
                                                        ? ' (seleccionada)'
                                                        : ' — seleccionar esta finca'}
                                                </span>
                                            </button>
                                            <span className="block text-xs text-steel">
                                                {farm.city} · {farm.hectares} ha
                                            </span>
                                        </th>
                                        <td className="py-2.5 pr-3 font-mono text-xs text-steel">
                                            {farm.id}
                                        </td>
                                        <td className="py-2.5 pr-3">{farm.crop}</td>
                                        <td className="py-2.5 pr-3 text-steel">
                                            {REGION_LABEL[farm.region]}
                                            <a
                                                className="ml-2 text-xs underline underline-offset-2"
                                                href={`https://www.openstreetmap.org/?mlat=${farm.lat}&mlon=${farm.lng}#map=13/${farm.lat}/${farm.lng}`}
                                                target="_blank"
                                                rel="noreferrer noopener"
                                            >
                                                mapa
                                                <span className="sr-only">
                                                    {' '}
                                                    de {farm.name}, se abre en una pestaña nueva
                                                </span>
                                            </a>
                                        </td>
                                        <td className="tabular py-2.5 pr-3 text-steel">
                                            {farm.altitude} m
                                        </td>
                                        <td className="py-2.5">
                                            {selected && latest ? (
                                                <span className="inline-flex items-center gap-2">
                                                    <StatusDot status="ok" label="Con lecturas" />
                                                    <span className="tabular text-steel">
                                                        {formatValue(
                                                            latest.airTemperature,
                                                            temperature
                                                        )}{' '}
                                                        ·{' '}
                                                        {formatValue(latest.humidity, humidity)}
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-2">
                                                    <StatusDot
                                                        status="offline"
                                                        label="Sin lecturas cargadas"
                                                    />
                                                    <span className="text-steel">
                                                        Sin lecturas cargadas
                                                    </span>
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Section>
        </div>
    );
}
