import { Train, Zap, Fuel, MapPin, Clock } from 'lucide-react';
import PropTypes from 'prop-types';

const STATUS_CONFIG = {
    EN_SERVICIO:       { label: 'EN SERVICIO',   color: 'text-green-400',  border: 'border-green-500/30',  dot: 'bg-green-400', bg: 'bg-green-500/5' },
    EN_MANTENIMIENTO:  { label: 'MANTENIMIENTO', color: 'text-amber-400',  border: 'border-amber-500/30',  dot: 'bg-amber-400', bg: 'bg-amber-500/5' },
    STANDBY:           { label: 'STANDBY',        color: 'text-slate-400',  border: 'border-slate-700/40',  dot: 'bg-slate-500', bg: 'bg-slate-800/20' },
    RETIRADO:          { label: 'RETIRADO',       color: 'text-red-400',    border: 'border-red-500/30',    dot: 'bg-red-500',   bg: 'bg-red-500/5' },
};

export default function AssetCard({ train, isSelected, onClick }) {
    const sc = STATUS_CONFIG[train.status] || STATUS_CONFIG.STANDBY;
    const tractIcon = train.traction === 'electrico' ? Zap : Fuel;
    const TractIcon = tractIcon;

    return (
        <button
            onClick={onClick}
            className={`w-full text-left rounded-xl border p-3 transition-all duration-200 cursor-pointer
                ${isSelected
                    ? 'bg-rail/10 border-rail/50 shadow-[0_0_20px_rgba(29,111,165,0.2)]'
                    : `${sc.bg} ${sc.border} hover:border-rail/30 hover:bg-rail/5`
                }`}
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSelected ? 'bg-rail/20' : 'bg-occ-700/50'}`}>
                        <Train size={14} className={isSelected ? 'text-rail-glow' : 'text-slate-400'} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-200 leading-tight">{train.name}</p>
                        <p className="text-[9px] font-mono text-slate-500">{train.callsign}</p>
                    </div>
                </div>
                <div className={`flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${sc.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${train.status === 'EN_SERVICIO' ? '' : ''}`} />
                    {sc.label}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] font-mono">
                <div className="flex items-center gap-1 text-slate-500">
                    <TractIcon size={9} className="text-rail" />
                    <span className="capitalize">{train.traction}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                    <MapPin size={9} className="text-slate-500" />
                    <span className="truncate">{train.routeName || train.route}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                    <Clock size={9} />
                    <span>{train.odometer?.toLocaleString()} km</span>
                </div>
                {train.type === 'pasajeros' && train.occupancy !== null && (
                    <div className={`text-[9px] font-mono ${train.occupancy > 85 ? 'text-amber-400' : 'text-slate-500'}`}>
                        {train.occupancy}% ocup.
                    </div>
                )}
                {train.type === 'carga' && train.tonsLoaded !== null && (
                    <div className="text-[9px] font-mono text-slate-500">
                        {train.tonsLoaded?.toLocaleString()} t
                    </div>
                )}
            </div>

            {train.delayMin > 3 && (
                <div className="mt-2 text-[9px] font-mono text-amber-400 bg-amber-500/10 rounded px-2 py-0.5">
                    +{train.delayMin} min retraso
                </div>
            )}
        </button>
    );
}

AssetCard.propTypes = {
    train:      PropTypes.object.isRequired,
    isSelected: PropTypes.bool,
    onClick:    PropTypes.func,
};
