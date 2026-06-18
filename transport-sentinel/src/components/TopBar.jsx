import { useState, useEffect } from 'react';
import { Menu, X, Radio, Train } from 'lucide-react';
import PropTypes from 'prop-types';

const FLEET_TABS = [
    { id: 'todos',      label: 'TODOS' },
    { id: 'pasajeros',  label: 'PASAJEROS' },
    { id: 'carga',      label: 'CARGA' },
];

const MODE_TABS = [
    { id: 'LIVE',      label: 'EN VIVO' },
    { id: 'HISTORICO', label: 'HISTÓRICO' },
];

export default function TopBar({ fleetType, onFleetTypeChange, mode, onModeChange, title, onMenuToggle, isMobileMenuOpen }) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const pad = n => String(n).padStart(2, '0');
    const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;
    const dateStr = time.toLocaleDateString('es-VE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <header className="h-12 bg-occ-900/95 border-b border-occ-700/40 backdrop-blur-xl flex items-center px-3 gap-3 flex-shrink-0">
            {/* Mobile menu toggle */}
            <button
                onClick={onMenuToggle}
                className="lg:hidden text-slate-500 hover:text-slate-300 p-1"
            >
                {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {/* Title / breadcrumb */}
            <div className="flex items-center gap-2 min-w-0">
                <Train size={14} className="text-rail flex-shrink-0" />
                <span className="text-xs font-mono text-slate-400 truncate hidden sm:block">{title}</span>
            </div>

            <div className="flex-1" />

            {/* Fleet type toggle */}
            <div className="flex bg-occ-800/80 rounded-lg p-0.5 border border-occ-700/40">
                {FLEET_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onFleetTypeChange(tab.id)}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-md transition-all duration-150 ${
                            fleetType === tab.id
                                ? 'bg-rail text-white shadow-[0_0_10px_rgba(29,111,165,0.4)]'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Mode toggle */}
            <div className="flex bg-occ-800/80 rounded-lg p-0.5 border border-occ-700/40">
                {MODE_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onModeChange(tab.id)}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-md transition-all duration-150 flex items-center gap-1.5 ${
                            mode === tab.id
                                ? 'bg-occ-700 text-slate-200'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {tab.id === 'LIVE' && mode === 'LIVE' && (
                            <Radio size={9} className="text-green-400 animate-pulse-slow" />
                        )}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Clock */}
            <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-mono text-slate-200 font-bold tracking-widest">{timeStr}</span>
                <span className="text-[9px] font-mono text-slate-500 capitalize">{dateStr}</span>
            </div>
        </header>
    );
}

TopBar.propTypes = {
    fleetType:        PropTypes.string.isRequired,
    onFleetTypeChange:PropTypes.func.isRequired,
    mode:             PropTypes.string.isRequired,
    onModeChange:     PropTypes.func.isRequired,
    title:            PropTypes.string,
    onMenuToggle:     PropTypes.func,
    isMobileMenuOpen: PropTypes.bool,
};
