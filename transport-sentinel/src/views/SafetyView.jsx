import { ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';
import { SvgBarChart, SvgDonut } from '../components/SvgCharts.jsx';
import PropTypes from 'prop-types';

const SEVERITY_CONFIG = {
    CRITICO: { bg: 'bg-red-500/10',    border: 'border-red-500/30',   text: 'text-red-400',   badge: 'bg-red-500/20 text-red-400' },
    MAYOR:   { bg: 'bg-amber-500/10',  border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-400' },
    MENOR:   { bg: 'bg-slate-800/30',  border: 'border-slate-700/30', text: 'text-slate-400', badge: 'bg-slate-700/30 text-slate-400' },
};

const STATUS_ICONS = { ABIERTO: AlertTriangle, CERRADO: CheckCircle };
const STATUS_COLORS = { ABIERTO: 'text-red-400', CERRADO: 'text-green-400' };

const typeChartData = [
    { label: 'Retraso Mayor', value: 2, color: '#f59e0b' },
    { label: 'Avería',        value: 2, color: '#ef4444' },
    { label: 'Near-Miss',     value: 1, color: '#f97316' },
    { label: 'Retraso Menor', value: 1, color: '#64748b' },
];

// Weekly incident bars (last 10 weeks, seeded)
const weeklyIncidents = Array.from({ length: 10 }, (_, i) => ({
    label: `S${i + 1}`,
    value: [1, 0, 2, 1, 0, 1, 0, 2, 0, 1][i] ?? 0,
    color: '#ef4444',
}));

export default function SafetyView({ incidents, kpis }) {
    const open   = incidents.filter(i => i.status === 'ABIERTO');
    const closed = incidents.filter(i => i.status === 'CERRADO');

    const mttrPerType = [
        { name: 'Eléctrico', mtbf: 3100, mttr: 2.8, sil: 'SIL-2' },
        { name: 'Mecánico',  mtbf: 2600, mttr: 4.2, sil: 'SIL-1' },
        { name: 'Señaliz.',  mtbf: 4200, mttr: 1.5, sil: 'SIL-2' },
        { name: 'Tracción',  mtbf: 2900, mttr: 6.1, sil: 'SIL-1' },
    ];

    // Donut segments from typeChartData
    const donutSegments = typeChartData.map(d => ({
        value: d.value,
        color: d.color,
        label: d.label,
    }));

    const totalIncidents = typeChartData.reduce((s, d) => s + d.value, 0);

    return (
        <div className="h-full overflow-y-auto space-y-3 pr-1">
            {/* Safety KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className={`occ-card p-3 ${kpis.diasSinAccidente > 30 ? 'border-green-500/30' : 'border-amber-500/30'}`}>
                    <p className="mono-label flex items-center gap-1"><ShieldAlert size={10} /> Días sin Accidente</p>
                    <p className={`text-4xl font-bold font-mono mt-1 ${kpis.diasSinAccidente > 30 ? 'text-green-400' : 'text-amber-400'}`}>{kpis.diasSinAccidente ?? '—'}</p>
                </div>
                <div className={`occ-card p-3 ${open.length === 0 ? 'border-green-500/20' : 'border-red-500/30'}`}>
                    <p className="mono-label flex items-center gap-1"><AlertTriangle size={10} /> Incidentes Abiertos</p>
                    <p className={`text-4xl font-bold font-mono mt-1 ${open.length === 0 ? 'text-green-400' : 'text-red-400'}`}>{open.length}</p>
                </div>
                <div className="occ-card p-3">
                    <p className="mono-label">SPAD (30d)</p>
                    <p className="text-4xl font-bold font-mono text-green-400 mt-1">0</p>
                    <p className="text-[9px] font-mono text-slate-600">señales en rojo violadas</p>
                </div>
                <div className="occ-card p-3">
                    <p className="mono-label">Infrac. Velocidad (30d)</p>
                    <p className="text-4xl font-bold font-mono text-amber-400 mt-1">2</p>
                    <p className="text-[9px] font-mono text-slate-600">menores · sin consecuencias</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3">
                {/* Incident log */}
                <div className="space-y-2">
                    <p className="mono-label">REGISTRO DE INCIDENTES</p>
                    {incidents.map(incident => {
                        const sc = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.MENOR;
                        const StatusIcon = STATUS_ICONS[incident.status] || CheckCircle;
                        return (
                            <div key={incident.id} className={`rounded-xl border p-3 ${sc.bg} ${sc.border}`}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${sc.badge}`}>{incident.severity}</span>
                                        <span className="text-[9px] font-mono text-slate-500">{incident.id}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <StatusIcon size={10} className={STATUS_COLORS[incident.status]} />
                                        <span className={`text-[9px] font-mono font-bold ${STATUS_COLORS[incident.status]}`}>{incident.status}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-200 mb-1.5">{incident.description}</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] font-mono">
                                    <div className="text-slate-600">Fecha: <span className="text-slate-400">{incident.date}</span></div>
                                    <div className="text-slate-600">Tren: <span className="text-rail-glow">{incident.trainId}</span></div>
                                    <div className="text-slate-600">Causa: <span className="text-slate-400">{incident.rootCause}</span></div>
                                    <div className="text-slate-600">Tipo: <span className="text-slate-400">{incident.type?.replace('_', ' ')}</span></div>
                                </div>
                                {incident.correctiveAction && (
                                    <div className="mt-2 text-[9px] font-mono text-slate-500 border-t border-occ-700/30 pt-1.5">
                                        <span className="text-green-500">Acción correctiva:</span> {incident.correctiveAction}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Right: charts */}
                <div className="flex flex-col gap-3">
                    {/* Type distribution donut */}
                    <div className="occ-card p-3">
                        <p className="mono-label mb-2">Incidentes por Tipo</p>
                        <SvgDonut
                            segments={donutSegments}
                            size={120}
                            centerText={String(totalIncidents)}
                        />
                    </div>

                    {/* RAMS by subsystem */}
                    <div className="occ-card p-3 flex-1">
                        <p className="mono-label mb-2">RAMS por Subsistema</p>
                        <table className="w-full text-[9px] font-mono">
                            <thead>
                                <tr className="border-b border-occ-700/40">
                                    <th className="text-left pb-1 text-slate-600">Sistema</th>
                                    <th className="text-right pb-1 text-slate-600">MTBF</th>
                                    <th className="text-right pb-1 text-slate-600">MTTR</th>
                                    <th className="text-right pb-1 text-slate-600">SIL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mttrPerType.map(r => (
                                    <tr key={r.name} className="border-b border-occ-700/20">
                                        <td className="py-1.5 text-slate-300">{r.name}</td>
                                        <td className="py-1.5 text-right text-rail-glow">{r.mtbf}h</td>
                                        <td className={`py-1.5 text-right ${r.mttr <= 4 ? 'text-green-400' : 'text-amber-400'}`}>{r.mttr}h</td>
                                        <td className="py-1.5 text-right text-violet-400">{r.sil}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="mt-3 pt-2 border-t border-occ-700/30 space-y-1 text-[9px] font-mono text-slate-500">
                            <p><span className="text-slate-300 font-bold">EN 50126</span> — RAMS Ferroviario</p>
                            <p>SIL-2: Riesgo Tolerable &lt; 10⁻⁷/h</p>
                            <p>SIL-1: Riesgo Tolerable &lt; 10⁻⁶/h</p>
                        </div>
                    </div>

                    {/* Safety weekly bar chart */}
                    <div className="occ-card p-3">
                        <p className="mono-label mb-2">Incidentes Últimos 30 días</p>
                        <SvgBarChart
                            data={weeklyIncidents}
                            height={100}
                            color="#ef4444"
                            showValues={false}
                            formatValue={v => Math.round(v).toString()}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

SafetyView.propTypes = {
    incidents: PropTypes.array,
    kpis:      PropTypes.object,
};

SafetyView.defaultProps = { incidents: [], kpis: {} };
