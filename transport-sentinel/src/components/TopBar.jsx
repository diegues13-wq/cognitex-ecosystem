import { useState, useEffect } from 'react';
import { Radio, Train } from 'lucide-react';
import PropTypes from 'prop-types';

const FLEET_TABS = [
    { id: 'todos',     label: 'TODOS' },
    { id: 'pasajeros', label: 'PASAJEROS' },
    { id: 'carga',     label: 'CARGA' },
];

const MODE_TABS = [
    { id: 'live',      label: 'EN VIVO' },
    { id: 'historico', label: 'HISTÓRICO' },
];

export default function TopBar({ fleetType, onFleetTypeChange, timeMode, onTimeModeChange }) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const id = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const pad = n => String(n).padStart(2, '0');
    const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;
    const dateStr = time.toLocaleDateString('es', { weekday: 'short', day: '2-digit', month: 'short' });

    return (
        /* SOLID background — no backdrop-blur (Skia AVX2 → SIGILL) */
        <header className="h-11 bg-[#05090f] border-b border-[#122030] flex items-center px-3 gap-3 flex-shrink-0">

            {/* Brand mark */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <Train size={13} className="text-[#1d6fa5]" />
                <span className="text-[10px] font-mono text-[#2a6090] tracking-widest hidden sm:block">CCO</span>
            </div>

            <div className="w-px h-5 bg-[#122030]" />

            {/* Fleet type */}
            <div className="flex bg-[#08111c] rounded p-0.5 border border-[#122030] gap-0.5">
                {FLEET_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onFleetTypeChange(tab.id)}
                        className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded transition-colors duration-100 ${
                            fleetType === tab.id
                                ? 'bg-[#1d6fa5] text-white'
                                : 'text-[#2a4a6b] hover:text-slate-300'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Mode toggle */}
            <div className="flex bg-[#08111c] rounded p-0.5 border border-[#122030] gap-0.5">
                {MODE_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTimeModeChange(tab.id)}
                        className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded transition-colors duration-100 flex items-center gap-1.5 ${
                            timeMode === tab.id
                                ? 'bg-[#0e2035] text-[#38a8e0]'
                                : 'text-[#2a4a6b] hover:text-slate-300'
                        }`}
                    >
                        {tab.id === 'live' && timeMode === 'live' && (
                            <Radio size={8} className="text-green-400 animate-pulse-slow" />
                        )}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1" />

            {/* Clock */}
            <div className="hidden md:flex flex-col items-end flex-shrink-0">
                <span className="text-[11px] font-mono text-slate-200 font-bold tracking-widest">{timeStr}</span>
                <span className="text-[8px] font-mono text-[#2a4a6b] capitalize">{dateStr}</span>
            </div>
        </header>
    );
}

TopBar.propTypes = {
    fleetType:         PropTypes.string.isRequired,
    onFleetTypeChange: PropTypes.func.isRequired,
    timeMode:          PropTypes.string.isRequired,
    onTimeModeChange:  PropTypes.func.isRequired,
};
