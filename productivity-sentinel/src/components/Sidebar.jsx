import PropTypes from 'prop-types';
import { TrendingUp, PenLine, BarChart2, Lightbulb, ClipboardList, Sparkles, LogOut } from 'lucide-react';

const NAV_ITEMS = [
    { id: 'overview',  label: 'Overview',        Icon: TrendingUp    },
    { id: 'registro',  label: 'Registro Diario',  Icon: PenLine       },
    { id: 'analisis',  label: 'Análisis',          Icon: BarChart2     },
    { id: 'sintesis',  label: 'Síntesis Semanal',  Icon: Lightbulb     },
    { id: 'bitacora',  label: 'Bitácora',           Icon: ClipboardList },
];

export default function Sidebar({ activeSection, onSectionChange, onChatOpen, user, onLogout }) {
    return (
        <aside className="w-64 bg-[#0a0a10] border-r border-white/5 flex flex-col h-screen fixed left-0 top-0 z-40">
            {/* Header */}
            <div className="p-6 border-b border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-transparent pointer-events-none" />
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                        <TrendingUp size={18} className="text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-white tracking-tight leading-tight">
                            PRODUCTIVITY<span className="text-violet-400">SENTINEL</span>
                        </h1>
                        <span className="text-[9px] font-mono text-violet-500/60 tracking-[0.2em] uppercase">Control de Mejora</span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest pl-3 mb-3">Navegación</p>
                {NAV_ITEMS.map(({ id, label, Icon }) => {
                    const isActive = activeSection === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onSectionChange(id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                                isActive
                                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-[0_0_20px_-5px_rgba(124,58,237,0.3)]'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <Icon
                                size={16}
                                className={isActive ? 'text-violet-400 drop-shadow-[0_0_6px_rgba(124,58,237,0.8)]' : ''}
                            />
                            <span>{label}</span>
                            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
                        </button>
                    );
                })}
            </nav>

            {/* Chat Button */}
            <div className="px-4 pb-2">
                <button
                    onClick={onChatOpen}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold text-violet-300 bg-violet-600/15 border border-violet-500/25 hover:bg-violet-600/25 hover:border-violet-500/40 transition-all shadow-[0_0_20px_-8px_rgba(124,58,237,0.4)]"
                >
                    <Sparkles size={16} className="text-violet-400" />
                    <span>Chat AI</span>
                    <div className="ml-auto flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                    </div>
                </button>
            </div>

            {/* User + Logout */}
            <div className="p-4 border-t border-white/5">
                {user && (
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className="w-7 h-7 rounded-full bg-violet-600/20 border border-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-300">
                            {(user.displayName || user.email || 'U')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-semibold text-white truncate">{user.displayName || 'Usuario'}</p>
                            <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/20 rounded-xl transition-all group"
                >
                    <LogOut size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}

Sidebar.propTypes = {
    activeSection: PropTypes.string.isRequired,
    onSectionChange: PropTypes.func.isRequired,
    onChatOpen: PropTypes.func.isRequired,
    user: PropTypes.object,
    onLogout: PropTypes.func,
};
