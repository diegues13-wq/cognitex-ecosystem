import { useState } from 'react';
import {
    LayoutDashboard, Train, Wrench, Zap,
    ShieldAlert, Brain, ChevronRight, LogOut,
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

    async function expandProjects() {
        if (!railData) {
            const mod = await import('../data/railProjectsData.js');
            setRailData({ COUNTRIES: mod.COUNTRIES, getProjectsByCountry: mod.getProjectsByCountry });
            setSelectedCountry(mod.COUNTRIES[0]);
        }
        setProyExpanded(e => !e);
    }

    const countries       = railData?.COUNTRIES ?? ['Ecuador'];
    const countryProjects = railData ? railData.getProjectsByCountry(selectedCountry) : [];

    return (
        /* SOLID background — no backdrop-blur (causes Skia AVX2 SIGILL) */
        <aside
            className={`flex flex-col bg-[#07101a] border-r border-[#122030] transition-all duration-200 ${collapsed ? 'w-14' : 'w-56'} flex-shrink-0 h-full overflow-hidden`}
        >
            {/* Brand header */}
            <div className="flex items-center gap-2.5 px-3 py-3 border-b border-[#122030]">
                <div className="w-7 h-7 rounded-md bg-[#1d6fa5] flex items-center justify-center flex-shrink-0">
                    <Train size={14} className="text-white" />
                </div>
                {!collapsed && (
                    <div className="min-w-0 flex-1">
                        <h1 className="text-[11px] font-bold tracking-wider text-white leading-tight">
                            TRANSPORT<span className="text-[#38a8e0]">SENTINEL</span>
                        </h1>
                        <p className="text-[8px] font-mono text-[#1d6fa5] tracking-widest">Railway Fleet Mgmt.</p>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(c => !c)}
                    className="text-[#2a4a6b] hover:text-[#38a8e0] flex-shrink-0 transition-colors"
                >
                    <ChevronRight size={13} className={`transition-transform ${collapsed ? '' : 'rotate-180'}`} />
                </button>
            </div>

            {/* Live status strip */}
            {!collapsed && (
                <div className="px-3 py-2 border-b border-[#122030] bg-[#050e17]">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="status-dot-active" />
                        <span className="text-[9px] font-mono text-green-400 tracking-wider">CCO EN LÍNEA</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] font-mono">
                        <span className="text-[#2a4a6b]">Activos: <span className="text-slate-300">{kpis.trenesActivos ?? '—'}/{kpis.total ?? '—'}</span></span>
                        <span className="text-[#2a4a6b]">OTP: <span className={kpis.otp >= 85 ? 'text-green-400' : 'text-amber-400'}>{kpis.otp ?? '—'}%</span></span>
                        <span className="text-[#2a4a6b]">Alertas: <span className={kpis.incidentesHoy > 0 ? 'text-red-400' : 'text-green-400'}>{kpis.incidentesHoy ?? 0}</span></span>
                        <span className="text-[#2a4a6b]">Disp: <span className="text-[#38a8e0]">{kpis.ramsDisponibilidad ?? '—'}%</span></span>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-1.5 min-h-0">
                {NAV_SECTIONS.map(section => (
                    <div key={section.label} className="mb-0.5">
                        {!collapsed && (
                            <p className="text-[8px] font-mono font-bold text-[#1a3550] tracking-widest px-3 pt-2.5 pb-0.5 uppercase">
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
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors duration-100
                                        ${collapsed ? 'justify-center' : ''}
                                        ${isActive
                                            ? 'bg-[#0e2035] text-[#38a8e0] border-r-2 border-[#1d6fa5]'
                                            : 'text-[#3a5a78] hover:text-slate-300 hover:bg-[#0a1928]'
                                        }`}
                                >
                                    <Icon size={13} className={isActive ? 'text-[#1d6fa5]' : ''} />
                                    {!collapsed && <span className="text-[11px] font-medium">{item.label}</span>}
                                </button>
                            );
                        })}
                    </div>
                ))}

                {/* Proyectos Ferroviarios */}
                <div className="mb-0.5 border-t border-[#122030] mt-1">
                    {!collapsed && (
                        <p className="text-[8px] font-mono font-bold text-[#1a3550] tracking-widest px-3 pt-2.5 pb-0.5 uppercase">
                            PROYECTOS
                        </p>
                    )}
                    <button
                        onClick={() => {
                            if (collapsed) { setCollapsed(false); expandProjects(); }
                            else { expandProjects(); }
                        }}
                        title={collapsed ? 'Proyectos Ferroviarios' : undefined}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors duration-100
                            ${collapsed ? 'justify-center' : ''}
                            ${activeView === 'proyecto'
                                ? 'bg-[#0e2035] text-[#38a8e0] border-r-2 border-[#1d6fa5]'
                                : 'text-[#3a5a78] hover:text-slate-300 hover:bg-[#0a1928]'
                            }`}
                    >
                        <Globe size={13} className={activeView === 'proyecto' ? 'text-[#1d6fa5]' : ''} />
                        {!collapsed && (
                            <>
                                <span className="text-[11px] font-medium flex-1">Explorar Proyectos</span>
                                <ChevronDown size={10} className={`transition-transform ${proyExpanded ? 'rotate-180' : ''}`} />
                            </>
                        )}
                    </button>

                    {!collapsed && proyExpanded && (
                        <div className="px-2 pb-2 space-y-1.5">
                            <select
                                value={selectedCountry}
                                onChange={e => setSelectedCountry(e.target.value)}
                                className="w-full text-[10px] font-mono bg-[#08111c] border border-[#122030] rounded px-2 py-1 text-slate-300 outline-none focus:border-[#1d6fa5]"
                            >
                                {countries.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <div className="space-y-0.5">
                                {countryProjects.map(project => (
                                    <button
                                        key={project.id}
                                        onClick={() => onProjectSelect(project)}
                                        className="w-full flex items-start gap-2 px-2 py-1.5 rounded text-left hover:bg-[#0a1928] transition-colors group"
                                    >
                                        <span className="text-[11px] flex-shrink-0">{TYPE_ICON[project.type] ?? '🚇'}</span>
                                        <div className="min-w-0">
                                            <div className="text-[10px] font-mono text-slate-300 group-hover:text-white truncate">{project.name}</div>
                                            <div className="text-[9px] font-mono text-[#1a3550] truncate">{project.city} · {project.yearOpened}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Footer */}
            <div className="border-t border-[#122030] py-1.5 flex-shrink-0">
                {isMockAuth && !collapsed && (
                    <div className="mx-2 mb-1.5 px-2 py-1 rounded bg-[#1a0e2e] border border-[#2d1a4a]">
                        <p className="text-[8px] font-mono text-[#9d6fdc] text-center">MODO SIMULACIÓN</p>
                    </div>
                )}
                <button
                    onClick={onLogout}
                    title={collapsed ? 'Cerrar Sesión' : undefined}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-[#2a4a6b] hover:text-red-400 transition-colors ${collapsed ? 'justify-center' : ''}`}
                >
                    <LogOut size={12} />
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
