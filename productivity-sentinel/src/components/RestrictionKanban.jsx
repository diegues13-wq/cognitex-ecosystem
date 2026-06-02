import PropTypes from 'prop-types';
import { AlertCircle, FlaskConical, CheckCircle2 } from 'lucide-react';
import { CAUSAS_RAIZ, METAS } from '../utils/dataGenerator';

const COLUMNS = [
    { id: 'activa',         label: 'Activas',          Icon: AlertCircle,  color: 'red',    border: 'border-red-500/30',    bg: 'bg-red-500/5',    iconColor: 'text-red-400'    },
    { id: 'en_experimento', label: 'En Experimento',   Icon: FlaskConical, color: 'yellow', border: 'border-amber-500/30', bg: 'bg-amber-500/5', iconColor: 'text-amber-400' },
    { id: 'neutralizada',   label: 'Neutralizadas',    Icon: CheckCircle2, color: 'green',  border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', iconColor: 'text-emerald-400' },
];

function RestrictionCard({ restriction, column }) {
    const causa = CAUSAS_RAIZ[restriction.causa_raiz];
    const metas = (restriction.metas_afectadas || [])
        .map(mid => METAS.find(m => m.id === mid))
        .filter(Boolean);

    return (
        <div className={`border rounded-xl p-4 space-y-3 ${column.border} ${column.bg} transition-all hover:brightness-110`}>
            <div>
                <p className="text-sm font-semibold text-white leading-snug">{restriction.descripcion}</p>
            </div>

            {causa && (
                <div className="flex items-center gap-1.5">
                    <span className="text-base">{causa.emoji}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{causa.label}</span>
                </div>
            )}

            {restriction.dias_activa > 0 && (
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                    <span className="text-[10px] text-gray-500 font-mono">{restriction.dias_activa} días activa</span>
                </div>
            )}

            {metas.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {metas.map(m => (
                        <span key={m.id} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] text-gray-400 font-medium">
                            {m.nombre}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

RestrictionCard.propTypes = {
    restriction: PropTypes.object.isRequired,
    column: PropTypes.object.isRequired,
};

export default function RestrictionKanban({ restrictions }) {
    return (
        <div className="bg-[#0d0d14] border border-white/8 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Panel de Restricciones</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Patrones sistémicos que bloquean el progreso</p>
            </div>

            {/* Kanban columns */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {COLUMNS.map(col => {
                    const cards = restrictions.filter(r => r.estado === col.id);
                    return (
                        <div key={col.id} className="flex flex-col gap-3">
                            {/* Column header */}
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/3 border border-white/5">
                                <col.Icon size={14} className={col.iconColor} />
                                <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">{col.label}</span>
                                <span className={`ml-auto w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${col.bg} ${col.iconColor} border ${col.border}`}>
                                    {cards.length}
                                </span>
                            </div>

                            {/* Cards */}
                            {cards.length === 0 ? (
                                <div className="border border-white/5 border-dashed rounded-xl p-4 text-center">
                                    <p className="text-[10px] text-gray-700">Sin restricciones</p>
                                </div>
                            ) : (
                                cards.map(r => <RestrictionCard key={r.id} restriction={r} column={col} />)
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

RestrictionKanban.propTypes = {
    restrictions: PropTypes.array.isRequired,
};
