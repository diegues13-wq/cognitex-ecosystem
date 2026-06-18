import PropTypes from 'prop-types';

const STATUS_COLORS = {
    ok:      { border: 'border-green-500/30',  dot: 'bg-green-400',  text: 'text-green-400',  glow: 'shadow-[0_0_20px_rgba(74,222,128,0.15)]' },
    warning: { border: 'border-amber-500/40',  dot: 'bg-amber-400',  text: 'text-amber-400',  glow: 'shadow-[0_0_20px_rgba(251,191,36,0.15)]' },
    alert:   { border: 'border-red-500/40',    dot: 'bg-red-500',    text: 'text-red-400',    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]' },
    info:    { border: 'border-rail/30',        dot: 'bg-rail',       text: 'text-rail-glow',  glow: 'shadow-[0_0_20px_rgba(29,111,165,0.15)]' },
};

export default function KPICard({ label, value, unit, icon: Icon, status = 'info', subLabel, trend }) {
    const colors = STATUS_COLORS[status] || STATUS_COLORS.info;

    return (
        <div className={`occ-card p-4 ${colors.border} ${colors.glow} flex flex-col gap-2 min-h-[110px]`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {Icon && <Icon size={14} className={colors.text} />}
                    <span className="mono-label">{label}</span>
                </div>
                <span className={`w-2 h-2 rounded-full ${colors.dot} ${status === 'alert' ? 'animate-blink' : ''}`} />
            </div>
            <div className="flex items-end gap-1.5 mt-auto">
                <span className={`kpi-value ${colors.text}`}>{value}</span>
                {unit && <span className="text-slate-400 text-sm font-mono mb-1">{unit}</span>}
            </div>
            {(subLabel || trend !== undefined) && (
                <div className="flex items-center justify-between mt-0.5">
                    {subLabel && <span className="text-[10px] text-slate-500 font-mono">{subLabel}</span>}
                    {trend !== undefined && (
                        <span className={`text-[10px] font-mono ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

KPICard.propTypes = {
    label:    PropTypes.string.isRequired,
    value:    PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    unit:     PropTypes.string,
    icon:     PropTypes.elementType,
    status:   PropTypes.oneOf(['ok', 'warning', 'alert', 'info']),
    subLabel: PropTypes.string,
    trend:    PropTypes.number,
};
