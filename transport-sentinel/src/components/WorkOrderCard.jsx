import { Wrench, AlertTriangle, CheckCircle, Clock, Brain } from 'lucide-react';
import PropTypes from 'prop-types';

const PRIORITY_COLORS = {
    ALTA:  { bg: 'bg-red-500/15',   border: 'border-red-500/30',   text: 'text-red-400',   badge: 'bg-red-500/20 text-red-400' },
    MEDIA: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-400' },
    BAJA:  { bg: 'bg-slate-800/40', border: 'border-slate-700/30', text: 'text-slate-400', badge: 'bg-slate-700/40 text-slate-400' },
};

const STATUS_ICONS = {
    PENDIENTE:   { icon: Clock,         color: 'text-slate-400' },
    EN_CURSO:    { icon: Wrench,        color: 'text-amber-400' },
    COMPLETADO:  { icon: CheckCircle,   color: 'text-green-400' },
    VENCIDO:     { icon: AlertTriangle, color: 'text-red-400' },
};

const TYPE_LABELS = {
    PREVENTIVO: 'PREV',
    CORRECTIVO: 'CORR',
    PREDICTIVO: 'PRED',
    INSPECCION: 'INSP',
};

export default function WorkOrderCard({ order }) {
    const p = PRIORITY_COLORS[order.priority] || PRIORITY_COLORS.BAJA;
    const s = STATUS_ICONS[order.status] || STATUS_ICONS.PENDIENTE;
    const StatusIcon = s.icon;
    const progressPct = order.triggerType === 'KM' && order.triggerValue
        ? Math.min(100, Math.round((order.currentValue / order.triggerValue) * 100))
        : null;

    return (
        <div className={`rounded-lg border p-3 ${p.bg} ${p.border} flex flex-col gap-2`}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <StatusIcon size={14} className={s.color} />
                    <span className="text-[10px] font-mono text-slate-300 truncate font-bold">{order.id}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${p.badge}`}>
                        {order.priority}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-occ-700/50 text-slate-400">
                        {TYPE_LABELS[order.type] || order.type}
                    </span>
                </div>
            </div>

            <div>
                <p className="text-xs text-slate-200 font-medium leading-tight">{order.component}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{order.assetId} · {order.depot}</p>
            </div>

            {progressPct !== null && (
                <div>
                    <div className="flex justify-between mb-1">
                        <span className="text-[9px] font-mono text-slate-500">Progreso ({order.currentValue?.toLocaleString()} / {order.triggerValue?.toLocaleString()} km)</span>
                        <span className={`text-[9px] font-mono font-bold ${p.text}`}>{progressPct}%</span>
                    </div>
                    <div className="h-1.5 bg-occ-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${progressPct >= 95 ? 'bg-red-500' : progressPct >= 85 ? 'bg-amber-400' : 'bg-rail'}`}
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    {order.remainingLifePct !== null && order.remainingLifePct !== undefined && (
                        <p className={`text-[9px] font-mono mt-0.5 ${p.text}`}>
                            Vida útil restante: {order.remainingLifePct}%
                        </p>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                <span>Fecha: {order.scheduledDate}</span>
                {order.aiPredictedFailureDate && (
                    <span className="flex items-center gap-1 text-violet-400">
                        <Brain size={9} />IA: fallo {order.aiPredictedFailureDate} ({order.aiConfidencePct}%)
                    </span>
                )}
            </div>
        </div>
    );
}

WorkOrderCard.propTypes = {
    order: PropTypes.object.isRequired,
};
