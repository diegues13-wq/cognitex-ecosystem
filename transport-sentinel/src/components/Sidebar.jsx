import { useState } from 'react';
import {
    LayoutDashboard, Train, Wrench, Zap,
    ShieldAlert, Brain, Settings, ChevronRight, LogOut,
    Activity, TrendingUp, Globe, ChevronDown,
} from 'lucide-react';
import PropTypes from 'prop-types';

const NAV_SECTIONS = [
    {
        label: 'OPERACIONES',
        items: [
            { id: 'cco',        label: 'Centro de Control', icon: LayoutDashboard },
            { id: 'operations', label: 'Operaciones / OTP', icon: Activity },
            { id: 'commercial', label: 'Comercial',         icon: TrendingUp },
        ],
    },
    {
        label: 'ACTIVOS',
        items: [
            { id: 'fleet',       label: 'Flota',        icon: Train },
            { id: 'maintenance', label: 'Mantenimiento', icon: Wrench },
        ],
    },
    {
        label: 'ANALÍTICA',
        items: [
            { id: 'energy', label: 'Energía',        icon: Zap },
            { id: 'safety', label: 'Seguridad/RAMS', icon: ShieldAlert },
        ],
    },
    {
        label: 'IA',
        items: [
            { id: 'ai', label: 'IA Ferroviaria', icon: Brain },
        ],
    },
];

const TYPE_ICON = { metro: '🚇', intercity: '🚄', lrt: '🚊', cable: '🚡', suburbano: '🚆' };

export default function Sidebar({ activeView, onNavigate, kpis, onLogout, isMockAuth, onProjectSelect }) {
    const [collapsed,       setCollapsed]       = useState(false);
    const [proyExpanded,    setProyExpanded]     = useState(false);
    const [selectedCountry, setSelectedCountry] = useState('Ecuador');
    const [railData,        setRailData]         = useState(null);

    // Lazy-load railProjectsData only when user expands the section (avoids SIGILL)
    async function expandProjects() {
        if (!railData) {
            const mod = await import('../data/railProjectsData.js');
            setRailData({ COUNTRIES: mod.COUNTRIES, getProjectsByCountry: mod.getProjectsByCountry });
            setSelectedCountry(mod.COUNTRIES[0]);
        }
        setProyExpanded(e => !e);
    }

    const countries        = railData?.COUNTRIES ?? ['Ecuador'];
    const countryProjects  = railData ? railData.getProjectsByCountry(selectedCountry) : [];

    return (
        <aside
            className={`flex flex-col bg-occ-900/95 border-r border-occ-700/40 backdrop-blur-xl transition-all duration-300 ${collapsed ? 'w-14' : 'w-60'} flex-shrink-0 h-full overflow-hidden`}
        >
            {/* Brand header */}
            <div className="flex items-center gap-3 px-3 py-4 border-b border-occ-700/30">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(109,40,217,0.4)]">
                    <Train size={16} className="text-white" />
                </div>
                {!collapsed && (
                    <div className="min-w-0">
                        <h1 className="text-xs font-bold tracking-wider text-white leading-tight">
                            TRANSPORT<span className="text-rail-glow">SENTINEL</span>
                        </h1>
                        <p className="text-[8px] font-mono text-rail/60 tracking-widest leading-tight">Railway Fleet Mgmt.</p>
                    </div>
                )}
                <button onClick={() => setCollapsed(c => !c)} className="ml-auto text-slate-600 hover:text-slate-400 flex-shrink-0">
                    <ChevronRight size={14} className={`transition-transform ${collapsed ? '' : 'rotate-180'}`} />
                </button>
            </div>

            {/* Status bar */}
            {!collapsed && (
                <div className="px-3 py-2 border-b border-occ-700/30">
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className="status-dot-active" />
                        <span className="text-[9px] font-mono text-green-400">CCO EN LÍNEA</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] font-mono text-slate-500">
                        <span>Activos: <span className="text-slate-300">{kpis.trenesActivos ?? '—'}/{kpis.total ?? '—'}</span></span>
                        <span>OTP: <span className={kpis.otp >= 85 ? 'text-green-400' : 'text-amber-400'}>{kpis.otp ?? '—'}%</span></span>
                        <span>Alertas: <span className={kpis.incidentesHoy > 0 ? 'text-red-400' : 'text-green-400'}>{kpis.incidentesHoy ?? 0}</span></span>
                        <span>Disp: <span className="text-rail-glow">{kpis.ramsDisponibilidad ?? '—'}%</span></span>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-2 min-h-0">
                {NAV_SECTIONS.map(section => (
                    <div key={section.label} className="mb-1">
                        {!collapsed && (
                            <p className="text-[8px] font-mono font-bold text-occ-700 tracking-widest px-3 pt-3 pb-1 uppercase">
                                {section.label}
                            </p>
                        )}
                        {section.items.map(item => {
                            const Icon = item.icon;
                            const isActive = activeView === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onNavigate(item.id)}
                                    title={collapsed ? item.label : undefined}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all duration-150 ${collapsed ? 'justify-center' : ''}
                                        ${isActive
                                            ? 'bg-rail/15 text-rail-glow border-r-2 border-rail-glow'
                                            : 'text-slate-500 hover:text-slate-300 hover:bg-occ-800/50'
                                        }`}
                                >
                                    <Icon size={14} className={isActive ? 'text-rail-glow' : ''} />
                                    {!collapsed && <span className="text-[11px] font-medium">{item.label}</span>}
                                </button>
                            );
                        })}
                    </div>
                ))}

                {/* ── Proyectos Ferroviarios section ── */}
                <div className="mb-1 border-t border-occ-700/30 mt-2">
                    {!collapsed && (
                        <p className="text-[8px] font-mono font-bold text-occ-700 tracking-widest px-3 pt-3 pb-1 uppercase">
                            PROYECTOS FERROVIARIOS
                        </p>
                    )}

                    {/* Toggle proyectos button */}
                    <button
                        onClick={() => {
                            if (collapsed) { setCollapsed(false); expandProjects(); }
                            else { expandProjects(); }
                        }}
                        title={collapsed ? 'Proyectos Ferroviarios' : undefined}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all duration-150 ${collapsed ? 'justify-center' : ''}
                            ${activeView === 'proyecto'
                                ? 'bg-rail/15 text-rail-glow border-r-2 border-rail-glow'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-occ-800/50'
                            }`}
                    >
                        <Globe size={14} className={activeView === 'proyecto' ? 'text-rail-glow' : ''} />
                        {!collapsed && (
                            <>
                                <span className="text-[11px] font-medium flex-1">Explorar Proyectos</span>
                                <ChevronDown size={11} className={`transition-transform ${proyExpanded ? 'rotate-180' : ''}`}/>
                            </>
                        )}
                    </button>

                    {/* Country + Project selector — expanded */}
                    {!collapsed && proyExpanded && (
                        <div className="px-2 pb-2 space-y-1.5">
                            {/* Country selector */}
                            <select
                                value={selectedCountry}
                                onChange={e => setSelectedCountry(e.target.value)}
                                className="w-full text-[10px] font-mono bg-occ-800/80 border border-occ-700/50 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-rail/50"
                            >
                                {countries.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>

                            {/* Project buttons for selected country */}
                            <div className="space-y-0.5">
                                {countryProjects.map(project => (
                                    <button
                                        key={project.id}
                                        onClick={() => onProjectSelect(project)}
                                        className="w-full flex items-start gap-2 px-2 py-1.5 rounded text-left hover:bg-occ-800/60 transition-colors group"
                                    >
                                        <span className="text-[11px] flex-shrink-0 mt-0.5">{TYPE_ICON[project.type] ?? '🚇'}</span>
                                        <div className="min-w-0">
                                            <div className="text-[10px] font-mono text-slate-300 group-hover:text-white truncate leading-tight">{project.name}</div>
                                            <div className="text-[9px] font-mono text-occ-700 truncate">{project.city} · {project.yearOpened}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Footer */}
            <div className="border-t border-occ-700/30 py-2 flex-shrink-0">
                <button
                    onClick={() => onNavigate('settings')}
                    title={collapsed ? 'Configuración' : undefined}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:text-slate-400 transition-colors ${collapsed ? 'justify-center' : ''}`}
                >
                    <Settings size={13} />
                    {!collapsed && <span className="text-[10px] font-mono">Configuración</span>}
                </button>

                {isMockAuth && !collapsed && (
                    <div className="mx-3 mb-2 mt-1 px-2 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                        <p className="text-[8px] font-mono text-violet-400 text-center leading-tight">MODO SIMULACIÓN</p>
                    </div>
                )}

                <button
                    onClick={onLogout}
                    title={collapsed ? 'Cerrar Sesión' : undefined}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:text-red-400 transition-colors ${collapsed ? 'justify-center' : ''}`}
                >
                    <LogOut size={13} />
                    {!collapsed && <span className="text-[10px] font-mono">Cerrar Sesión</span>}
                </button>
            </div>
        </aside>
    );
}

Sidebar.propTypes = {
    activeView:      PropTypes.string.isRequired,
    onNavigate:      PropTypes.func.isRequired,
    kpis:            PropTypes.object,
    onLogout:        PropTypes.func,
    isMockAuth:      PropTypes.bool,
    onProjectSelect: PropTypes.func.isRequired,
};

Sidebar.defaultProps = {
    kpis:       {},
    onLogout:   () => {},
    isMockAuth: true,
};
