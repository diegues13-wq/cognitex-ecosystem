import { Activity, Clock, Route } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import PropTypes from 'prop-types';
import { ROUTES } from '../utils/dataGenerator.js';

export default function OperationsView({ history, kpis }) {
    const routePerf = ROUTES.map(route => ({
        name: route.shortName,
        otp: Math.round(75 + Math.random() * 22),
        retrasoMedio: parseFloat((1 + Math.random() * 10).toFixed(1)),
        viajes: route.type === 'carga' ? Math.round(2 + Math.random() * 4) : Math.round(10 + Math.random() * 20),
        tipo: route.type,
    }));

    const delayDist = [
        { range: '0-3 min', count: 45, color: '#22c55e' },
        { range: '4-10 min', count: 18, color: '#f59e0b' },
        { range: '11-20 min', count: 8, color: '#f97316' },
        { range: '> 20 min', count: 3, color: '#ef4444' },
    ];

    return (
        <div className="h-full overflow-y-auto space-y-3 pr-1">
            {/* KPI strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'OTP Global',         value: `${kpis.otp ?? '—'}%`,    ok: (kpis.otp ?? 0) >= 85 },
                    { label: 'Retraso Medio',       value: '4.2 min',                ok: true },
                    { label: 'Trenes Cancelados',   value: '0',                      ok: true },
                    { label: 'Km Prog. vs Real',    value: '98.4%',                  ok: true },
                ].map(({ label, value, ok }) => (
                    <div key={label} className={`occ-card p-3 ${ok ? 'border-green-500/20' : 'border-amber-500/30'}`}>
                        <p className="mono-label">{label}</p>
                        <p className={`text-2xl font-bold font-mono mt-1 ${ok ? 'text-green-400' : 'text-amber-400'}`}>{value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* OTP Trend 30 days */}
                <div className="occ-card p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity size={12} className="text-rail-glow" />
                        <span className="mono-label">Tendencia OTP — 30 días</span>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={history} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradOTP" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1d6fa5" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#1d6fa5" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                            <XAxis dataKey="displayDate" tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} interval={4} />
                            <YAxis tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} domain={[60, 100]} />
                            <Tooltip contentStyle={{ background: '#081526', border: '1px solid #163060', borderRadius: 8, fontSize: 10, fontFamily: 'monospace' }} itemStyle={{ color: '#38a8e0' }} labelStyle={{ color: '#94a3b8' }} />
                            <ReferenceLine y={85} stroke="#f59e0b" strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: 'Objetivo 85%', fill: '#f59e0b', fontSize: 8, fontFamily: 'monospace' }} />
                            <Area type="monotone" dataKey="otp" stroke="#1d6fa5" strokeWidth={2} fill="url(#gradOTP)" name="OTP %" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Delay distribution */}
                <div className="occ-card p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={12} className="text-amber-400" />
                        <span className="mono-label">Distribución de Retrasos (hoy)</span>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={delayDist} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                            <XAxis dataKey="range" tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                            <YAxis tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                            <Tooltip contentStyle={{ background: '#081526', border: '1px solid #163060', borderRadius: 8, fontSize: 10, fontFamily: 'monospace' }} itemStyle={{ color: '#94a3b8' }} />
                            <Bar dataKey="count" name="Trenes" radius={[3, 3, 0, 0]}>
                                {delayDist.map((d, i) => (
                                    <Cell key={i} fill={d.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Km realized trend */}
                <div className="occ-card p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Route size={12} className="text-green-400" />
                        <span className="mono-label">Km Recorridos — 30 días</span>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={history} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradKm" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                            <XAxis dataKey="displayDate" tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} interval={4} />
                            <YAxis tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                            <Tooltip contentStyle={{ background: '#081526', border: '1px solid #163060', borderRadius: 8, fontSize: 10, fontFamily: 'monospace' }} itemStyle={{ color: '#10b981' }} labelStyle={{ color: '#94a3b8' }} />
                            <Area type="monotone" dataKey="kmTraveled" stroke="#10b981" strokeWidth={2} fill="url(#gradKm)" name="Km" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Route performance table */}
                <div className="occ-card p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Route size={12} className="text-rail-glow" />
                        <span className="mono-label">Rendimiento por Ruta</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[10px] font-mono">
                            <thead>
                                <tr className="border-b border-occ-700/40">
                                    <th className="text-left pb-1.5 text-slate-600">Ruta</th>
                                    <th className="text-center pb-1.5 text-slate-600">OTP</th>
                                    <th className="text-right pb-1.5 text-slate-600">Ret. medio</th>
                                    <th className="text-right pb-1.5 text-slate-600">Viajes</th>
                                    <th className="text-right pb-1.5 text-slate-600">Tipo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {routePerf.sort((a, b) => b.otp - a.otp).map(r => (
                                    <tr key={r.name} className="border-b border-occ-700/20">
                                        <td className="py-1.5 text-slate-200 font-bold">{r.name}</td>
                                        <td className="py-1.5 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${r.otp >= 90 ? 'bg-green-500/15 text-green-400' : r.otp >= 80 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>
                                                {r.otp}%
                                            </span>
                                        </td>
                                        <td className="py-1.5 text-right text-slate-400">{r.retrasoMedio} min</td>
                                        <td className="py-1.5 text-right text-slate-300">{r.viajes}</td>
                                        <td className="py-1.5 text-right">
                                            <span className={`text-[8px] px-1.5 py-0.5 rounded ${r.tipo === 'pasajeros' ? 'bg-blue-500/15 text-blue-400' : r.tipo === 'carga' ? 'bg-amber-500/15 text-amber-400' : 'bg-violet-500/15 text-violet-400'}`}>
                                                {r.tipo}
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
    );
}

OperationsView.propTypes = {
    history: PropTypes.array,
    kpis:    PropTypes.object,
};

OperationsView.defaultProps = { history: [], kpis: {} };
