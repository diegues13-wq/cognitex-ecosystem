import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Train, MapPin, Users, Gauge, Zap, Building2, Wrench, Factory, ArrowLeft, ExternalLink } from 'lucide-react';

// ── Same Mercator math as TrainMap, parameterized by project center/zoom ────────
const TILE = 256;
function makeProjector(center, zoom, W, H) {
    const scale = Math.pow(2, zoom);
    const toWorld = (lat, lng) => {
        const x = (lng + 180) / 360 * TILE;
        const sin = Math.sin(lat * Math.PI / 180);
        const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * TILE;
        return { x: x * scale, y: y * scale };
    };
    const cw = toWorld(center.lat, center.lng);
    return (lat, lng) => {
        const w = toWorld(lat, lng);
        return {
            x: parseFloat(((w.x - cw.x) + W / 2).toFixed(2)),
            y: parseFloat(((w.y - cw.y) + H / 2).toFixed(2)),
        };
    };
}

// ── Google Maps Static API URL ───────────────────────────────────────────────────
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const DARK_STYLES = [
    'feature:all|element:geometry|color:0x0a1929',
    'feature:all|element:labels|visibility:off',
    'feature:water|element:geometry|color:0x010b18',
    'feature:landscape|element:geometry|color:0x061220',
    'feature:road|element:geometry|color:0x0d2040',
    'feature:road.highway|element:geometry|color:0x162a45',
    'feature:administrative.country|element:geometry.stroke|color:0x1d3a5c|weight:1',
].map(s => `&style=${encodeURIComponent(s)}`).join('');

function mapUrl(center) {
    if (!API_KEY) return null;
    return `https://maps.googleapis.com/maps/api/staticmap` +
        `?center=${center.lat},${center.lng}&zoom=${center.zoom}&size=680x380` +
        DARK_STYLES + `&key=${API_KEY}`;
}

// ── Status badge ─────────────────────────────────────────────────────────────────
const STATUS_STYLE = {
    operativo:    'bg-green-500/15 text-green-400 border-green-500/30',
    construccion: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    planificado:  'bg-slate-500/15 text-slate-400 border-slate-500/30',
};
const STATUS_LABEL = {
    operativo: 'Operativo', construccion: 'En Construcción', planificado: 'Planificado',
};

const TYPE_LABEL = {
    metro:    'Metro Urbano',
    intercity: 'Ferrocarril Intercity',
    lrt:      'Tren Ligero (LRT)',
    cable:    'Teleférico Urbano',
    suburbano:'Tren Suburbano',
};

// ── Compact stat card ────────────────────────────────────────────────────────────
function Stat({ icon: Icon, label, value, color = 'text-rail-glow' }) {
    return (
        <div className="occ-card rounded-lg p-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-rail/10 flex items-center justify-center flex-shrink-0">
                <Icon size={13} className="text-rail" />
            </div>
            <div className="min-w-0">
                <div className={`text-base font-bold font-mono ${color} leading-tight`}>{value}</div>
                <div className="text-[10px] font-mono text-slate-500 truncate">{label}</div>
            </div>
        </div>
    );
}

// ── Company row ───────────────────────────────────────────────────────────────────
function CompanyRow({ company, borderColor }) {
    return (
        <div className={`border-l-2 pl-3 py-1 ${borderColor}`}>
            <div className="text-[11px] font-semibold text-slate-200 leading-tight">{company.name}</div>
            <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-mono text-slate-500">{company.role}</span>
                {company.country && (
                    <span className="text-[9px] font-mono text-occ-700 bg-occ-800/60 px-1 rounded">{company.country}</span>
                )}
            </div>
            {company.product && (
                <div className="text-[9px] font-mono text-rail/70 mt-0.5">{company.product}</div>
            )}
            {company.contract && (
                <div className="text-[9px] font-mono text-slate-600 mt-0.5">{company.contract}</div>
            )}
        </div>
    );
}

// ── Project Map with SVG overlay ─────────────────────────────────────────────────
const MAP_W = 680, MAP_H = 380;

function ProjectMap({ project }) {
    const [imgError, setImgError] = useState(false);
    const [hoveredStop, setHoveredStop] = useState(null);

    const url = mapUrl(project.mapCenter);
    const proj = useMemo(
        () => makeProjector(project.mapCenter, project.mapCenter.zoom, MAP_W, MAP_H),
        [project]
    );

    const linePaths = useMemo(() => project.lines.map(line => {
        const pts = line.stops.map(s => proj(s.lat, s.lng));
        return {
            id:   line.id,
            name: line.name,
            color: line.color,
            d:    pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' '),
            pts,
            stops: line.stops,
        };
    }), [proj, project.lines]);

    if (!url || imgError) return (
        <div className="w-full aspect-video rounded-xl occ-card flex items-center justify-center">
            <span className="text-[11px] font-mono text-slate-600">API key no configurada — mapa no disponible</span>
        </div>
    );

    return (
        <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: `${MAP_W}/${MAP_H}` }}>
            <img
                src={url}
                alt={`Mapa ${project.name}`}
                className="absolute inset-0 w-full h-full object-fill"
                draggable={false}
                onError={() => setImgError(true)}
            />
            <svg
                viewBox={`0 0 ${MAP_W} ${MAP_H}`}
                className="absolute inset-0 w-full h-full"
                style={{ pointerEvents: 'none' }}
            >
                {/* Route lines */}
                {linePaths.map(line => (
                    <path
                        key={line.id}
                        d={line.d}
                        stroke={line.color}
                        strokeWidth={3}
                        fill="none"
                        opacity={0.9}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                ))}

                {/* Station markers */}
                {linePaths.map(line =>
                    line.pts.map((p, si) => (
                        <g key={`${line.id}-${si}`} style={{ pointerEvents: 'all' }}
                            onMouseEnter={() => setHoveredStop({ name: line.stops[si].name, x: p.x, y: p.y })}
                            onMouseLeave={() => setHoveredStop(null)}>
                            <circle cx={p.x} cy={p.y} r={4} fill="#040d1a" stroke={line.color} strokeWidth={1.5}/>
                        </g>
                    ))
                )}

                {/* Hover tooltip */}
                {hoveredStop && (() => {
                    const { name, x, y } = hoveredStop;
                    const bw = name.length * 5.5 + 14;
                    const tx = Math.min(x + 8, MAP_W - bw - 4);
                    const ty = Math.max(y - 20, 6);
                    return (
                        <g>
                            <rect x={tx} y={ty} width={bw} height={16} rx={4} fill="#081526" stroke="#1d6fa5" strokeWidth={0.7} opacity={0.95}/>
                            <text x={tx + 7} y={ty + 11} fontSize="8" fontFamily="monospace" fill="#e2e8f0">{name}</text>
                        </g>
                    );
                })()}

                {/* Map header */}
                <text x={10} y={14} fontSize="7" fontFamily="monospace" fill="#1d6fa5" opacity={0.7}>
                    {project.name.toUpperCase()} · RED DE RUTAS
                </text>
            </svg>

            {/* Line legend */}
            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                {project.lines.map(l => (
                    <div key={l.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(4,13,26,0.88)', border: '1px solid #0d2040' }}>
                        <div className="w-3 h-0.5 rounded" style={{ background: l.color }}/>
                        <span className="font-mono text-slate-500" style={{ fontSize: '9px' }}>{l.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Main ProjectView ──────────────────────────────────────────────────────────────
export default function ProjectView({ project, onBack }) {
    const [activeTab, setActiveTab] = useState('overview');

    const fmt = n => n?.toLocaleString('es') ?? '—';
    const fmtM = n => n ? `$${(n / 1e6).toFixed(0)} M USD` : '—';

    const tabs = [
        { id: 'overview',  label: 'Resumen' },
        { id: 'operators', label: 'Empresas' },
        { id: 'stations',  label: 'Estaciones' },
        { id: 'tech',      label: 'Datos Técnicos' },
    ];

    return (
        <div className="h-full overflow-y-auto pr-1 space-y-4">

            {/* ── Header ── */}
            <div className="occ-card rounded-xl p-4">
                <div className="flex items-start gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-[11px] font-mono mt-0.5 flex-shrink-0"
                    >
                        <ArrowLeft size={13}/> Volver
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-xl font-bold text-white tracking-tight leading-tight">{project.name}</h1>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[project.status]}`}>
                                {STATUS_LABEL[project.status]}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 bg-occ-800/60 px-2 py-0.5 rounded-full border border-occ-700/40">
                                {TYPE_LABEL[project.type] ?? project.type}
                            </span>
                        </div>
                        <p className="text-sm text-rail/80 font-mono mt-0.5">{project.subtitle}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-mono text-slate-500">
                            <MapPin size={11} className="text-rail/60"/>
                            <span>{project.city}, {project.country}</span>
                            <span className="text-occ-700">·</span>
                            <span>Inaugurado: {project.yearOpened}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── KPI Strip ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <Stat icon={Train}    label="Líneas"          value={project.totalLines}         />
                <Stat icon={MapPin}   label="Estaciones"      value={project.totalStations}       />
                <Stat icon={Train}    label="Trenes/Unidades" value={project.totalTrains || '—'}  />
                <Stat icon={Gauge}    label="Km de Red"       value={`${project.totalKm} km`}    />
                <Stat icon={Gauge}    label="Vel. Máx."       value={`${project.maxSpeedKmh} km/h`} />
                <Stat icon={Users}    label="Pasaj./Día"      value={project.dailyPassengers ? fmt(project.dailyPassengers) : '—'} color="text-amber-400" />
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 border-b border-occ-700/40">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`px-4 py-2 text-[11px] font-mono font-medium border-b-2 transition-colors ${
                            activeTab === t.id
                                ? 'text-rail-glow border-rail-glow'
                                : 'text-slate-500 border-transparent hover:text-slate-300'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── Tab: Overview ── */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {/* Map - 60% */}
                    <div className="lg:col-span-3">
                        <ProjectMap project={project} />
                    </div>

                    {/* Key facts + financing - 40% */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="occ-card rounded-xl p-4">
                            <h3 className="text-[10px] font-mono font-bold text-occ-700 tracking-widest uppercase mb-3">Datos Destacados</h3>
                            <ul className="space-y-2">
                                {project.keyFacts.map((f, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="text-rail mt-0.5 flex-shrink-0">◆</span>
                                        <span className="text-[11px] text-slate-300 leading-relaxed">{f}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {project.financing && (
                            <div className="occ-card rounded-xl p-4">
                                <h3 className="text-[10px] font-mono font-bold text-occ-700 tracking-widest uppercase mb-3">Financiamiento</h3>
                                <div className="text-xl font-bold font-mono text-amber-400 mb-2">{fmtM(project.financing.totalCostUSD)}</div>
                                <ul className="space-y-1">
                                    {project.financing.sources.map((s, i) => (
                                        <li key={i} className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                                            <span className="text-occ-700">›</span> {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Tab: Operators & Companies ── */}
            {activeTab === 'operators' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Operators */}
                    <div className="occ-card rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Building2 size={13} className="text-rail"/>
                            <h3 className="text-[10px] font-mono font-bold text-occ-700 tracking-widest uppercase">Operadores</h3>
                        </div>
                        <div className="space-y-3">
                            {project.companies.operators.map((c, i) => (
                                <CompanyRow key={i} company={c} borderColor="border-rail" />
                            ))}
                        </div>
                    </div>
                    {/* Manufacturers */}
                    <div className="occ-card rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Factory size={13} className="text-amber-400"/>
                            <h3 className="text-[10px] font-mono font-bold text-occ-700 tracking-widest uppercase">Fabricantes</h3>
                        </div>
                        <div className="space-y-3">
                            {project.companies.manufacturers.map((c, i) => (
                                <CompanyRow key={i} company={c} borderColor="border-amber-500/60" />
                            ))}
                        </div>
                    </div>
                    {/* Maintenance */}
                    <div className="occ-card rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Wrench size={13} className="text-purple-400"/>
                            <h3 className="text-[10px] font-mono font-bold text-occ-700 tracking-widest uppercase">Mantenimiento</h3>
                        </div>
                        <div className="space-y-3">
                            {project.companies.maintenance.map((c, i) => (
                                <CompanyRow key={i} company={c} borderColor="border-purple-500/60" />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Tab: Stations ── */}
            {activeTab === 'stations' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {project.lines.map(line => (
                        <div key={line.id} className="occ-card rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: line.color }}/>
                                <h3 className="text-[11px] font-mono font-bold text-slate-300">{line.name}</h3>
                                <span className="ml-auto text-[10px] font-mono text-slate-600">{line.stops.length} estaciones</span>
                            </div>
                            <div className="space-y-0.5 max-h-64 overflow-y-auto">
                                {line.stops.map((stop, si) => (
                                    <div key={si} className="flex items-center gap-2 py-0.5">
                                        <div className="flex flex-col items-center gap-0 flex-shrink-0">
                                            <div className="w-2 h-2 rounded-full border-2 flex-shrink-0" style={{ borderColor: line.color, background: '#040d1a' }}/>
                                            {si < line.stops.length - 1 && (
                                                <div className="w-0.5 h-3" style={{ background: line.color, opacity: 0.4 }}/>
                                            )}
                                        </div>
                                        <span className="text-[11px] font-mono text-slate-400">{stop.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Tab: Technical Data ── */}
            {activeTab === 'tech' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="occ-card rounded-xl p-4 space-y-2">
                        <h3 className="text-[10px] font-mono font-bold text-occ-700 tracking-widest uppercase mb-3">Infraestructura</h3>
                        {[
                            ['Tipo de Sistema',      TYPE_LABEL[project.type] ?? project.type],
                            ['Año de Inauguración',  project.yearOpened],
                            ['Líneas en Operación',  project.totalLines],
                            ['Estaciones Totales',   project.totalStations],
                            ['Longitud Total',       `${project.totalKm} km`],
                        ].map(([k, v]) => (
                            <div key={k} className="flex justify-between items-baseline py-1 border-b border-occ-700/20">
                                <span className="text-[11px] font-mono text-slate-500">{k}</span>
                                <span className="text-[11px] font-mono text-slate-200 font-medium">{v}</span>
                            </div>
                        ))}
                    </div>
                    <div className="occ-card rounded-xl p-4 space-y-2">
                        <h3 className="text-[10px] font-mono font-bold text-occ-700 tracking-widest uppercase mb-3">Características Técnicas</h3>
                        {[
                            ['Material Rodante',     `${project.totalTrains || '—'} unidades`],
                            ['Velocidad Máxima',     `${project.maxSpeedKmh} km/h`],
                            ['Electrificación',      project.electrification],
                            ['Tecnología',           project.technology],
                            ['Pasajeros/Día',        project.dailyPassengers ? fmt(project.dailyPassengers) : '—'],
                            ['Inversión Total',      fmtM(project.financing?.totalCostUSD)],
                        ].map(([k, v]) => (
                            <div key={k} className="flex justify-between items-baseline py-1 border-b border-occ-700/20">
                                <span className="text-[11px] font-mono text-slate-500">{k}</span>
                                <span className="text-[11px] font-mono text-slate-200 font-medium text-right max-w-48 leading-tight">{v}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

ProjectView.propTypes = {
    project: PropTypes.object.isRequired,
    onBack:  PropTypes.func.isRequired,
};

Stat.propTypes       = { icon: PropTypes.elementType, label: PropTypes.string, value: PropTypes.any, color: PropTypes.string };
CompanyRow.propTypes = { company: PropTypes.object, borderColor: PropTypes.string };
ProjectMap.propTypes = { project: PropTypes.object };
