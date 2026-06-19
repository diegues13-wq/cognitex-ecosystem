import { Wrench, Brain, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { SvgBarChart, ProgressBar } from '../components/SvgCharts.jsx';
import PropTypes from 'prop-types';
import WorkOrderCard from '../components/WorkOrderCard.jsx';

export default function MaintenanceView({ orders, rams, kpis }) {
    const open     = orders.filter(o => o.status !== 'COMPLETADO');
    const pending  = orders.filter(o => o.status === 'PENDIENTE');
    const inCourse = orders.filter(o => o.status === 'EN_CURSO');
    const done     = orders.filter(o => o.status === 'COMPLETADO');

    const preventivos  = orders.filter(o => o.type === 'PREVENTIVO').length;
    const correctivos  = orders.filter(o => o.type === 'CORRECTIVO').length;
    const predictivos  = orders.filter(o => o.type === 'PREDICTIVO').length;

    const criticalAI = orders.filter(o => o.aiPredictedFailureDate && o.remainingLifePct <= 15);

    const typeChart = [
        { label: 'PREV', value: preventivos, color: '#1d6fa5' },
        { label: 'CORR', value: correctivos, color: '#ef4444' },
        { label: 'PRED', value: predictivos, color: '#7c3aed' },
        { label: 'INSP', value: orders.filter(o => o.type === 'INSPECCION').length, color: '#64748b' },
    ];

    // RAMS data for table
    const ramsData = rams || [];

    // Component life progress bars — pulled from criticalAI or top orders with remainingLifePct
    const compLifeOrders = orders
        .filter(o => o.remainingLifePct != null)
        .sort((a, b) => a.remainingLifePct - b.remainingLifePct)
        .slice(0, 5);

    return (
        <div className="h-full overflow-y-auto space-y-3 pr-1">
            {/* RAMS KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'MTBF',        value: `${kpis.mtbf?.toLocaleString() ?? '—'} h`,  sub: 'Objetivo: > 2,800 h',  ok: (kpis.mtbf ?? 0) >= 2800 },
                    { label: 'MTTR',        value: `${kpis.mttr ?? '—'} h`,                    sub: 'Objetivo: < 4 h',       ok: (kpis.mttr ?? 99) <= 4 },
                    { label: 'Disponibilidad', value: `${kpis.ramsDisponibilidad ?? '—'}%`,     sub: 'EN 50126 — Objetivo >90%', ok: (kpis.ramsDisponibilidad ?? 0) >= 90 },
                    { label: 'Cumpl. Prev.',  value: `${kpis.prevMaintCompliance ?? '—'}%`,    sub: 'Objetivo: > 95%',       ok: (kpis.prevMaintCompliance ?? 0) >= 95 },
                ].map(({ label, value, sub, ok }) => (
                    <div key={label} className={`occ-card p-3 ${ok ? 'border-green-500/20' : 'border-amber-500/30'}`}>
                        <p className="mono-label">{label}</p>
                        <p className={`text-2xl font-bold font-mono mt-1 ${ok ? 'text-green-400' : 'text-amber-400'}`}>{value}</p>
                        <p className="text-[9px] font-mono text-slate-600 mt-0.5">{sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-3">
                {/* Work orders */}
                <div className="flex flex-col gap-3">
                    {/* Status summary */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono bg-occ-800/50 border border-occ-700/40 rounded-lg px-2.5 py-1.5">
                            <Clock size={11} className="text-slate-400" />
                            <span className="text-slate-400">Pendientes: <span className="text-white font-bold">{pending.length}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1.5">
                            <Wrench size={11} className="text-amber-400" />
                            <span className="text-amber-400">En curso: <span className="font-bold">{inCourse.length}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono bg-green-500/10 border border-green-500/30 rounded-lg px-2.5 py-1.5">
                            <CheckCircle size={11} className="text-green-400" />
                            <span className="text-green-400">Completadas: <span className="font-bold">{done.length}</span></span>
                        </div>
                        {criticalAI.length > 0 && (
                            <div className="flex items-center gap-1.5 text-[10px] font-mono bg-violet-500/10 border border-violet-500/30 rounded-lg px-2.5 py-1.5">
                                <Brain size={11} className="text-violet-400" />
                                <span className="text-violet-400">IA críticas: <span className="font-bold">{criticalAI.length}</span></span>
                            </div>
                        )}
                    </div>

                    {/* AI Predictive alerts */}
                    {criticalAI.length > 0 && (
                        <div className="occ-card p-3 border-violet-500/20 bg-violet-500/5">
                            <div className="flex items-center gap-2 mb-2">
                                <Brain size={12} className="text-violet-400" />
                                <span className="text-[10px] font-mono font-bold text-violet-400 tracking-widest">ALERTAS PREDICTIVAS DE IA</span>
                            </div>
                            <div className="space-y-2">
                                {criticalAI.map(o => (
                                    <div key={o.id} className="flex items-center gap-2 text-[10px] font-mono">
                                        <AlertTriangle size={10} className="text-violet-400 flex-shrink-0" />
                                        <span className="text-slate-300"><span className="text-violet-400 font-bold">{o.assetId}</span> — {o.component}: fallo predicho <span className="text-violet-300">{o.aiPredictedFailureDate}</span> (conf. {o.aiConfidencePct}%) · Vida útil restante: <span className="text-red-400 font-bold">{o.remainingLifePct}%</span></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Work orders grid */}
                    <div>
                        <p className="mono-label mb-2">ÓRDENES DE TRABAJO — ABIERTAS ({open.length})</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {open.map(order => (
                                <WorkOrderCard key={order.id} order={order} />
                            ))}
                        </div>
                    </div>

                    {done.length > 0 && (
                        <div>
                            <p className="mono-label mb-2">COMPLETADAS ({done.length})</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {done.map(order => (
                                    <WorkOrderCard key={order.id} order={order} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: charts */}
                <div className="flex flex-col gap-3">
                    {/* OT type distribution */}
                    <div className="occ-card p-3">
                        <p className="mono-label mb-2">Tipo de OTs</p>
                        <SvgBarChart
                            data={typeChart}
                            height={120}
                            showValues
                            formatValue={v => Math.round(v).toString()}
                        />
                    </div>

                    {/* Component life progress bars */}
                    {compLifeOrders.length > 0 && (
                        <div className="occ-card p-3">
                            <p className="mono-label mb-3">Vida útil componentes</p>
                            <div className="space-y-3">
                                {compLifeOrders.map(o => (
                                    <ProgressBar
                                        key={o.id}
                                        label={o.component ?? o.id}
                                        value={o.remainingLifePct}
                                        max={100}
                                        color={o.remainingLifePct <= 15 ? '#ef4444' : o.remainingLifePct <= 40 ? '#f59e0b' : '#1d6fa5'}
                                        showPct
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* RAMS table per asset */}
                    <div className="occ-card p-3 flex-1">
                        <p className="mono-label mb-2">RAMS por Activo</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-[9px] font-mono">
                                <thead>
                                    <tr className="border-b border-occ-700/40">
                                        <th className="text-left pb-1.5 text-slate-600">Tren</th>
                                        <th className="text-right pb-1.5 text-slate-600">MTBF</th>
                                        <th className="text-right pb-1.5 text-slate-600">A%</th>
                                        <th className="text-right pb-1.5 text-slate-600">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ramsData.slice(0, 8).map(r => (
                                        <tr key={r.trainId} className="border-b border-occ-700/20">
                                            <td className="py-1 text-slate-400">{r.trainId}</td>
                                            <td className="py-1 text-right text-slate-300">{r.mtbf?.toLocaleString()}h</td>
                                            <td className={`py-1 text-right font-bold ${r.availability >= 90 ? 'text-green-400' : 'text-amber-400'}`}>{r.availability}%</td>
                                            <td className="py-1 text-right">
                                                <span className={`px-1.5 py-0.5 rounded ${r.healthScore >= 75 ? 'bg-green-500/15 text-green-400' : r.healthScore >= 55 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>
                                                    {r.healthScore}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

MaintenanceView.propTypes = {
    orders: PropTypes.array,
    rams:   PropTypes.array,
    kpis:   PropTypes.object,
};

MaintenanceView.defaultProps = { orders: [], rams: [], kpis: {} };
