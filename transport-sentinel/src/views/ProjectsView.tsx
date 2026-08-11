import { useMemo, useState } from 'react';

import {
    PROJECT_COUNTRIES,
    projectsByCountry,
    type ProjectCompany,
    type ProjectKind,
    type ProjectStatus,
    type RailProject,
} from '../data/railProjects';
import { Panel, Readout, StatusPill } from '../components/Panel';

/**
 * Reference: the railway systems of the Americas.
 *
 * This was the console's hidden feature. The data — fourteen networks with
 * their operators, manufacturers, maintenance contracts and financing — was
 * lazily imported by the sidebar and rendered by a view reachable only after
 * expanding a collapsed panel and picking a country from a select. It is a
 * section now, which is what it always was.
 *
 * The system map is drawn from the published coordinates rather than
 * composited over a Static Maps tile. The old version issued a billed image
 * request per project view and showed a grey "API key no configurada" box
 * without one; the projection is the same Web Mercator the live map uses, so
 * the two agree, and it works in every deployment.
 */

const KIND_LABEL: Record<ProjectKind, string> = {
    metro: 'Metro urbano',
    intercity: 'Ferrocarril interurbano',
    lrt: 'Tren ligero',
    cable: 'Teleférico urbano',
    suburbano: 'Tren suburbano',
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
    operativo: 'Operativo',
    construccion: 'En construcción',
    planificado: 'Planificado',
};

const STATUS_TONE: Record<ProjectStatus, 'ok' | 'warning' | 'offline'> = {
    operativo: 'ok',
    construccion: 'warning',
    planificado: 'offline',
};

const TABS = [
    { id: 'overview', label: 'Resumen' },
    { id: 'companies', label: 'Empresas' },
    { id: 'stations', label: 'Estaciones' },
    { id: 'technical', label: 'Datos técnicos' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function formatMillions(usd: number): string {
    return usd >= 1_000_000_000
        ? `${(usd / 1_000_000_000).toFixed(1)} mil M USD`
        : `${Math.round(usd / 1_000_000)} M USD`;
}

export default function ProjectsView() {
    const [country, setCountry] = useState(PROJECT_COUNTRIES[0] ?? 'Ecuador');
    const [projectId, setProjectId] = useState<string | null>(null);
    const [tab, setTab] = useState<TabId>('overview');

    const projects = useMemo(() => projectsByCountry(country), [country]);
    const project = projects.find((item) => item.id === projectId) ?? projects[0] ?? null;

    return (
        <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
            <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                    <span className="label-mono">País</span>
                    <select
                        value={country}
                        onChange={(event) => {
                            setCountry(event.target.value);
                            setProjectId(null);
                        }}
                        className="min-h-11 rounded-lg border border-steel/25 bg-navy-900 px-3 text-sm text-ice"
                    >
                        {PROJECT_COUNTRIES.map((name) => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>
                </label>

                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {projects.map((item) => (
                        <li key={item.id}>
                            <button
                                type="button"
                                onClick={() => {
                                    setProjectId(item.id);
                                    setTab('overview');
                                }}
                                aria-pressed={item.id === project?.id}
                                className={`occ-panel occ-selectable w-full p-3 text-left ${
                                    item.id === project?.id ? 'occ-selected' : ''
                                }`}
                            >
                                <span className="block text-sm font-medium text-ice">
                                    {item.name}
                                </span>
                                <span className="block text-xs text-steel">
                                    {item.city} · desde {item.yearOpened}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {project ? (
                <div className="flex flex-col gap-4">
                    <Panel>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h2 className="font-display text-lg font-semibold text-ice">
                                    {project.name}
                                </h2>
                                <p className="mt-1 text-sm text-steel">{project.subtitle}</p>
                                <p className="mt-1 text-sm text-steel">
                                    {project.city}, {project.country} · inaugurado en{' '}
                                    {project.yearOpened}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <StatusPill status={STATUS_TONE[project.status]}>
                                    {STATUS_LABEL[project.status]}
                                </StatusPill>
                                <span className="rounded-full border border-steel/25 px-2 py-0.5 text-xs text-steel">
                                    {KIND_LABEL[project.type]}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                            <Readout label="Líneas" value={`${project.totalLines}`} />
                            <Readout label="Estaciones" value={`${project.totalStations}`} />
                            <Readout
                                label="Unidades"
                                value={
                                    project.totalTrains > 0
                                        ? project.totalTrains.toLocaleString('es-EC')
                                        : 'n/d'
                                }
                            />
                            <Readout label="Red" value={`${project.totalKm}`} unit="km" />
                            <Readout label="Vel. máx." value={`${project.maxSpeedKmh}`} unit="km/h" />
                            <Readout
                                label="Pasajeros/día"
                                value={project.dailyPassengers.toLocaleString('es-EC')}
                            />
                        </div>
                    </Panel>

                    <div role="tablist" aria-label="Secciones del proyecto" className="flex gap-1">
                        {TABS.map((entry) => {
                            const active = entry.id === tab;
                            return (
                                <button
                                    key={entry.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => setTab(entry.id)}
                                    className={`min-h-11 border-b-2 px-4 text-sm ${
                                        active
                                            ? 'text-ice'
                                            : 'border-transparent text-steel hover:text-ice'
                                    }`}
                                    style={
                                        active ? { borderBottomColor: 'var(--color-brand)' } : undefined
                                    }
                                >
                                    {entry.label}
                                </button>
                            );
                        })}
                    </div>

                    {tab === 'overview' && <Overview project={project} />}
                    {tab === 'companies' && <Companies project={project} />}
                    {tab === 'stations' && <Stations project={project} />}
                    {tab === 'technical' && <Technical project={project} />}
                </div>
            ) : (
                <Panel>
                    <p className="text-sm text-steel">Sin sistemas registrados en este país.</p>
                </Panel>
            )}
        </div>
    );
}

// ── Tabs ────────────────────────────────────────────────────────────────────

function Overview({ project }: { project: RailProject }) {
    return (
        <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
                <SystemMap project={project} />
            </div>

            <div className="flex flex-col gap-4 lg:col-span-2">
                <Panel title="Datos destacados">
                    <ul className="m-0 flex list-none flex-col gap-2 p-0">
                        {project.keyFacts.map((fact) => (
                            <li key={fact} className="flex gap-2 text-sm text-ice">
                                <span aria-hidden="true" style={{ color: 'var(--color-brand)' }}>
                                    ◆
                                </span>
                                {fact}
                            </li>
                        ))}
                    </ul>
                </Panel>

                <Panel title="Financiamiento">
                    <p className="text-[length:var(--text-metric)] leading-none font-semibold tabular">
                        {formatMillions(project.financing.totalCostUSD)}
                    </p>
                    <ul className="mt-3 m-0 flex list-none flex-col gap-1 p-0 text-sm text-steel">
                        {project.financing.sources.map((source) => (
                            <li key={source}>{source}</li>
                        ))}
                    </ul>
                </Panel>
            </div>
        </div>
    );
}

function CompanyList({ title, companies }: { title: string; companies: ProjectCompany[] }) {
    return (
        <Panel title={title}>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {companies.map((company) => (
                    <li
                        key={`${company.name}-${company.role}`}
                        className="border-l-2 pl-3"
                        style={{ borderLeftColor: 'var(--color-brand)' }}
                    >
                        <p className="text-sm font-medium text-ice">{company.name}</p>
                        <p className="text-xs text-steel">
                            {company.role} · {company.country}
                        </p>
                        {company.product && (
                            <p className="mt-0.5 text-xs text-steel">{company.product}</p>
                        )}
                        {company.contract && (
                            <p className="mt-0.5 text-xs text-steel">{company.contract}</p>
                        )}
                    </li>
                ))}
            </ul>
        </Panel>
    );
}

function Companies({ project }: { project: RailProject }) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <CompanyList title="Operadores" companies={project.companies.operators} />
            <CompanyList title="Fabricantes" companies={project.companies.manufacturers} />
            <CompanyList title="Mantenimiento" companies={project.companies.maintenance} />
        </div>
    );
}

function Stations({ project }: { project: RailProject }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {project.lines.map((line) => (
                <Panel
                    key={line.id}
                    title={line.name}
                    action={
                        <span className="text-xs text-steel">{line.stops.length} estaciones</span>
                    }
                >
                    <ol className="m-0 flex list-none flex-col p-0">
                        {line.stops.map((stop, index) => (
                            <li key={stop.name} className="flex items-center gap-2 py-0.5">
                                <span className="flex flex-col items-center" aria-hidden="true">
                                    <span
                                        className="size-2 rounded-full border-2"
                                        style={{
                                            borderColor: line.color,
                                            backgroundColor: 'var(--color-navy-900)',
                                        }}
                                    />
                                    {index < line.stops.length - 1 && (
                                        <span
                                            className="h-3 w-0.5"
                                            style={{ backgroundColor: line.color, opacity: 0.5 }}
                                        />
                                    )}
                                </span>
                                <span className="text-sm text-ice">{stop.name}</span>
                            </li>
                        ))}
                    </ol>
                </Panel>
            ))}
        </div>
    );
}

function Technical({ project }: { project: RailProject }) {
    const rows: [string, string][] = [
        ['Tipo de sistema', KIND_LABEL[project.type]],
        ['Año de inauguración', String(project.yearOpened)],
        ['Líneas en operación', String(project.totalLines)],
        ['Estaciones', String(project.totalStations)],
        ['Longitud de red', `${project.totalKm} km`],
        [
            'Material rodante',
            project.totalTrains > 0 ? `${project.totalTrains} unidades` : 'No publicado',
        ],
        ['Velocidad máxima', `${project.maxSpeedKmh} km/h`],
        ['Electrificación', project.electrification],
        ['Tecnología', project.technology],
        ['Pasajeros por día', project.dailyPassengers.toLocaleString('es-EC')],
        ['Inversión total', formatMillions(project.financing.totalCostUSD)],
    ];

    return (
        <Panel title="Ficha técnica">
            <dl className="m-0 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                {rows.map(([label, value]) => (
                    <div
                        key={label}
                        className="flex justify-between gap-4 border-b border-steel/10 pb-1 text-sm"
                    >
                        <dt className="text-steel">{label}</dt>
                        <dd className="m-0 text-right text-ice">{value}</dd>
                    </div>
                ))}
            </dl>
        </Panel>
    );
}

// ── System map ──────────────────────────────────────────────────────────────

const MAP_W = 680;
const MAP_H = 400;
const MAP_PAD = 28;

/**
 * The published line geometry, projected and fitted.
 *
 * Web Mercator, the same projection the live fleet map uses, so the two agree
 * about shape. The scale is derived from the network's own bounding box
 * rather than the published `mapCenter.zoom`: those zoom levels were chosen
 * for a 680×380 Static Maps tile, and applied to this panel they left compact
 * systems as a knot in the middle and clipped the long ones.
 */
function SystemMap({ project }: { project: RailProject }) {
    const geometry = useMemo(() => {
        // Unit Mercator — scale is applied after the bounds are known.
        const toUnit = (lat: number, lng: number) => {
            const sin = Math.sin((lat * Math.PI) / 180);
            return {
                x: (lng + 180) / 360,
                y: 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI),
            };
        };

        const units = project.lines.map((line) =>
            line.stops.map((stop) => ({ stop, ...toUnit(stop.lat, stop.lng) }))
        );
        const all = units.flat();

        const xs = all.map((point) => point.x);
        const ys = all.map((point) => point.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        // A single-station system has zero extent; give it something to divide by.
        const spanX = maxX - minX || 1e-6;
        const spanY = maxY - minY || 1e-6;
        // One scale for both axes, so the network is not stretched.
        const scale = Math.min((MAP_W - MAP_PAD * 2) / spanX, (MAP_H - MAP_PAD * 2) / spanY);

        const offsetX = (MAP_W - spanX * scale) / 2;
        const offsetY = (MAP_H - spanY * scale) / 2;

        return project.lines.map((line, index) => ({
            id: line.id,
            name: line.name,
            color: line.color,
            points: (units[index] ?? []).map((point) => ({
                ...point.stop,
                x: (point.x - minX) * scale + offsetX,
                y: (point.y - minY) * scale + offsetY,
            })),
        }));
    }, [project]);

    const stationCount = project.lines.reduce((total, line) => total + line.stops.length, 0);
    const partial = project.lines.length < project.totalLines;

    return (
        <figure className="occ-panel m-0 overflow-hidden">
            <svg
                viewBox={`0 0 ${MAP_W} ${MAP_H}`}
                className="w-full"
                role="img"
                aria-label={`Trazado de ${project.name}: ${project.lines.length} líneas y ${stationCount} estaciones representadas.`}
            >
                <rect width={MAP_W} height={MAP_H} fill="var(--color-navy-900)" />

                {geometry.map((line) => (
                    <g key={line.id}>
                        <path
                            d={line.points
                                .map(
                                    (point, index) =>
                                        `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`
                                )
                                .join(' ')}
                            fill="none"
                            stroke={line.color}
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity={0.9}
                        />
                        {line.points.map((point) => (
                            <circle
                                key={point.name}
                                cx={point.x}
                                cy={point.y}
                                r={4}
                                fill="var(--color-navy-900)"
                                stroke={line.color}
                                strokeWidth={2}
                            >
                                <title>{`${point.name} — ${line.name}`}</title>
                            </circle>
                        ))}
                    </g>
                ))}
            </svg>

            <figcaption className="border-t border-steel/15 p-2">
                <span className="flex flex-wrap gap-x-3 gap-y-1">
                    {project.lines.map((line) => (
                        <span
                            key={line.id}
                            className="flex items-center gap-1.5 text-xs text-steel"
                        >
                            <span
                                className="inline-block h-0.5 w-4"
                                style={{ backgroundColor: line.color }}
                                aria-hidden="true"
                            />
                            {line.name}
                        </span>
                    ))}
                </span>
                {/* The research covers the terminals and main junctions of the
                    principal lines, not every branch. Saying so beats letting
                    a two-line diagram sit under a "6 líneas" headline. */}
                {partial && (
                    <span className="mt-1.5 block text-xs text-steel">
                        Trazado disponible para {project.lines.length} de {project.totalLines}{' '}
                        líneas.
                    </span>
                )}
            </figcaption>
        </figure>
    );
}
