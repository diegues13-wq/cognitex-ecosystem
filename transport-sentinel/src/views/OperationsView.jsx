import { useState, useEffect, useMemo } from 'react';
import { Activity, Clock, Route } from 'lucide-react';
import { SvgAreaChart, SvgBarChart } from '../components/SvgCharts.jsx';
import PropTypes from 'prop-types';

export default function OperationsView({ history, kpis }) {
    const [routes, setRoutes] = useState([]);

    useEffect(() => {
        import('../services/api.js').then(({ fetchRoutes }) => fetchRoutes()).then(setRoutes);
    }, []);

    const routePerf = useMemo(() => routes.map(route => {
        const seed = route.id?.charCodeAt(route.id.length - 1) ?? 0;
        return {
            name:         route.name,
            otp:          75 + (seed * 13 + 7) % 23,
            retrasoMedio: parseFloat((1 + (seed * 7 + 3) % 10).toFixed(1)),
            viajes:       route.type === 'carga'
                ? 2 + (seed * 3) % 5
                : 10 + (seed * 11) % 21,
            tipo: route.type,
        };
    }), [routes]);

    const delayDist = [
        { label: '0-3 min', value: 45, color: '#22c55e' },
        { label: '4-10 min', value: 18, color: '#f59e0b' },
        { label: '11-20 min', value: 8, color: '#f97316' },
        { label: '> 20 min', value: 3, color: '#ef4444' },
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
                    <SvgAreaChart
                        data={history}
                        xKey="displayDate"
                        yKey="otp"
                        color="#1d6fa5"
                        height={180}
                        yMin={60}
                        yMax={100}
                        formatY={v => `${v}%`}
                        refLine={85}
                        refLabel="85%"
                    />
                </div>

                {/* Delay distribution */}
                <div className="occ-card p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={12} className="text-amber-400" />
                        <span className="mono-label">Distribución de Retrasos (hoy)</span>
                    </div>
                    <SvgBarChart
                        data={delayDist}
                        height={180}
                        showValues
                        formatValue={v => Math.round(v).toString()}
                    />
                </div>

                {/* Km realized trend */}
                <div className="occ-card p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Route size={12} className="text-green-400" />
                        <span className="mono-label">Km Recorridos — 30 días</span>
                    </div>
                    <SvgAreaChart
                        data={history}
                        xKey="displayDate"
                        yKey="kmTraveled"
                        color="#10b981"
                        height={180}
                    />
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
