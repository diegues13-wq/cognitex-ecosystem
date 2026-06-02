import PropTypes from 'prop-types';
import { format, subDays } from 'date-fns';

function statusColor(value, thresholds, lowerIsBetter = false) {
    const [good, warn] = thresholds;
    if (lowerIsBetter) {
        if (value <= good) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Bueno' };
        if (value <= warn) return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Regular' };
        return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Crítico' };
    }
    if (value >= good) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Bueno' };
    if (value >= warn) return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Regular' };
    return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Crítico' };
}

function KPICard({ title, value, unit, subtitle, status, note }) {
    return (
        <div className={`bg-[#0d0d14] border rounded-2xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5 ${status.border}`}>
            <div className="flex items-start justify-between">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-tight">{title}</p>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${status.bg} ${status.text} border ${status.border}`}>
                    {status.label}
                </span>
            </div>
            <div className="flex items-baseline gap-1.5">
                <span className={`text-3xl font-black font-mono ${status.text}`}>{value}</span>
                <span className="text-xs text-gray-500">{unit}</span>
            </div>
            <p className="text-[10px] text-gray-600 leading-snug">{subtitle}</p>
            {note && <p className="text-[9px] text-gray-700 font-mono border-t border-white/5 pt-2">{note}</p>}
        </div>
    );
}

KPICard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    unit: PropTypes.string,
    subtitle: PropTypes.string,
    status: PropTypes.object.isRequired,
    note: PropTypes.string,
};

export default function KPICards({ entries, restrictions }) {
    const totalDays = 30;

    // 1. Adherencia al Registro
    const uniqueDays = new Set(entries.map(e => e.date)).size;
    const adherencia = Math.round((uniqueDays / totalDays) * 100);

    // 2. Tasa de Implementación
    const withAdjust = entries.filter(e => e.ajuste && e.implementado !== 'pendiente');
    const implemented = withAdjust.filter(e => e.implementado === 'si' || e.implementado === 'parcial');
    const implRate = withAdjust.length > 0 ? Math.round((implemented.length / withAdjust.length) * 100) : 0;

    // 3. Latencia Promedio (hardcoded MVP)
    const latencia = '~2 min/día';

    // 4. Tasa de Recurrencia (lower is better)
    const recurring = entries.filter(e => e.es_recurrente);
    const recurrenceRate = entries.length > 0 ? Math.round((recurring.length / entries.length) * 100) : 0;

    // 5. Restricciones Activas
    const activeRestrictions = (restrictions || []).filter(r => r.estado === 'activa').length;

    // 6. Restricciones Neutralizadas
    const neutralized = (restrictions || []).filter(r => r.estado === 'neutralizada').length;

    const kpis = [
        {
            title: 'Adherencia al Registro',
            value: adherencia,
            unit: '%',
            subtitle: `${uniqueDays} de ${totalDays} días con al menos un registro`,
            status: statusColor(adherencia, [80, 60]),
            note: 'Indicador de proceso — ¿Estás usando el sistema?',
        },
        {
            title: 'Tasa de Implementación',
            value: implRate,
            unit: '%',
            subtitle: `${implemented.length} de ${withAdjust.length} ajustes implementados (total o parcial)`,
            status: statusColor(implRate, [70, 50]),
            note: 'Indicador de proceso — ¿Los ajustes se ejecutan?',
        },
        {
            title: 'Latencia Promedio',
            value: latencia,
            unit: '',
            subtitle: 'Tiempo promedio para registrar un fallo desde que ocurre',
            status: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Bueno' },
            note: 'MVP — valor estimado',
        },
        {
            title: 'Tasa de Recurrencia ⭐',
            value: recurrenceRate,
            unit: '%',
            subtitle: `${recurring.length} fallos recurrentes de ${entries.length} registrados. Menor es mejor.`,
            status: statusColor(recurrenceRate, [30, 60], true),
            note: 'KPI principal — ¿El sistema reduce la repetición?',
        },
        {
            title: 'Restricciones Activas',
            value: activeRestrictions,
            unit: '',
            subtitle: 'Patrones sistémicos sin resolver actualmente',
            status: statusColor(activeRestrictions, [1, 3], true),
            note: 'Indicador de resultado — restricciones bloqueantes',
        },
        {
            title: 'Restricciones Neutralizadas',
            value: neutralized,
            unit: '',
            subtitle: 'Restricciones eliminadas o controladas permanentemente',
            status: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Acumulado' },
            note: 'Mayor es mejor — progreso acumulado del sistema',
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map(kpi => (
                <KPICard key={kpi.title} {...kpi} />
            ))}
        </div>
    );
}

KPICards.propTypes = {
    entries: PropTypes.array.isRequired,
    restrictions: PropTypes.array,
};
