import { AlertTriangle, Info, Wrench, Zap, Clock } from 'lucide-react';
import PropTypes from 'prop-types';

const ICONS = {
    MANTENIMIENTO: Wrench,
    PREDICTIVO:    Zap,
    RETRASO:       Clock,
    COMBUSTIBLE:   Zap,
    OCUPACION:     Info,
    ENERGIA:       Zap,
    INFO:          Info,
};

const PRIORITY_STYLES = {
    CRITICAL: 'text-red-400 border-red-500/30 bg-red-500/10',
    WARNING:  'text-amber-400 border-amber-500/30 bg-amber-500/10',
    INFO:     'text-slate-400 border-slate-700/30 bg-slate-800/30',
};

export default function AlertTicker({ alerts = [] }) {
    if (alerts.length === 0) return null;
    const tickerAlerts = [...alerts, ...alerts]; // duplicate for seamless loop

    return (
        <div className="h-8 bg-occ-900/80 border-b border-occ-700/40 flex items-center overflow-hidden relative">
            <div className="flex items-center gap-1 px-3 flex-shrink-0 border-r border-occ-700/40 h-full">
                <AlertTriangle size={12} className="text-amber-400" />
                <span className="text-[10px] font-mono text-amber-400 font-bold tracking-widest uppercase">CCO</span>
            </div>
            <div className="overflow-hidden flex-1 relative">
                <div className="flex gap-8 animate-ticker whitespace-nowrap">
                    {tickerAlerts.map((alert, i) => {
                        const Icon = ICONS[alert.type] || Info;
                        const style = PRIORITY_STYLES[alert.priority] || PRIORITY_STYLES.INFO;
                        return (
                            <span key={`${alert.id}-${i}`} className={`inline-flex items-center gap-2 text-[11px] font-mono`}>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] ${style}`}>
                                    <Icon size={10} />
                                    {alert.type}
                                </span>
                                <span className="text-slate-300">{alert.time}</span>
                                {alert.trainId && <span className="text-rail-glow font-bold">[{alert.trainId}]</span>}
                                <span className="text-slate-400">{alert.message}</span>
                                <span className="text-occ-700 ml-4">◆</span>
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

AlertTicker.propTypes = {
    alerts: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        time: PropTypes.string,
        type: PropTypes.string,
        trainId: PropTypes.string,
        message: PropTypes.string,
        priority: PropTypes.string,
    })),
};
