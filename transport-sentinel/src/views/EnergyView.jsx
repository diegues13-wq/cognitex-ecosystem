import { Zap, Fuel, Leaf, TrendingDown } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import PropTypes from 'prop-types';

export default function EnergyView({ energyData, kpis }) {
    const totalKwh = energyData.reduce((s, d) => s + (d.kwhElectrico || 0), 0);
    const totalFuel = energyData.reduce((s, d) => s + (d.litrosDiesel || 0), 0);
    const totalCo2 = energyData.reduce((s, d) => s + (d.co2Kg || 0), 0);
    const totalRegen = energyData.reduce((s, d) => s + (d.kwhRegen || 0), 0);

    return (
        <div className="h-full overflow-y-auto space-y-3 pr-1">
            {/* KPI strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="occ-card p-3">
                    <p className="mono-label flex items-center gap-1"><Zap size={10} /> kWh Eléctrico (30d)</p>
                    <p className="text-2xl font-bold font-mono text-rail-glow mt-1">{totalKwh.toLocaleString()}</p>
                    <p className="text-[9px] font-mono text-slate-600">~6.5 kWh/tren-km (UIC)</p>
                </div>
                <div className="occ-card p-3">
                    <p className="mono-label flex items-center gap-1"><Fuel size={10} /> Diésel (30d)</p>
                    <p className="text-2xl font-bold font-mono text-amber-400 mt-1">{totalFuel.toLocaleString()}</p>
                    <p className="text-[9px] font-mono text-slate-600">litros · ~2.5 L/km</p>
                </div>
                <div className="occ-card p-3 border-red-500/20">
                    <p className="mono-label flex items-center gap-1"><Leaf size={10} /> CO₂ (30d)</p>
                    <p className="text-2xl font-bold font-mono text-red-400 mt-1">{totalCo2.toLocaleString()}</p>
                    <p className="text-[9px] font-mono text-slate-600">kg · sólo tracción diesel</p>
                </div>
                <div className="occ-card p-3 border-green-500/20">
                    <p className="mono-label flex items-center gap-1"><TrendingDown size={10} /> Recuperado Regen.</p>
                    <p className="text-2xl font-bold font-mono text-green-400 mt-1">{totalRegen.toLocaleString()}</p>
                    <p className="text-[9px] font-mono text-slate-600">kWh frenado regenerativo</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Electric energy chart */}
                <div className="occ-card p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap size={12} className="text-rail-glow" />
                        <span className="mono-label">Consumo Eléctrico (kWh) — 30 días</span>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={energyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradKwh" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1d6fa5" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#1d6fa5" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                            <XAxis dataKey="displayDate" tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} interval={4} />
                            <YAxis tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                            <Tooltip contentStyle={{ background: '#081526', border: '1px solid #163060', borderRadius: 8, fontSize: 10, fontFamily: 'monospace' }} itemStyle={{ color: '#38a8e0' }} labelStyle={{ color: '#94a3b8' }} />
                            <Area type="monotone" dataKey="kwhElectrico" stroke="#1d6fa5" strokeWidth={2} fill="url(#gradKwh)" name="kWh Eléctrico" dot={false} />
                            <Area type="monotone" dataKey="kwhRegen" stroke="#10b981" strokeWidth={1.5} fill="none" name="kWh Regen." dot={false} strokeDasharray="4 3" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Diesel chart */}
                <div className="occ-card p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Fuel size={12} className="text-amber-400" />
                        <span className="mono-label">Consumo Diésel (L) y CO₂ (kg) — 30 días</span>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <ComposedChart data={energyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                            <XAxis dataKey="displayDate" tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} interval={4} />
                            <YAxis tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                            <Tooltip contentStyle={{ background: '#081526', border: '1px solid #163060', borderRadius: 8, fontSize: 10, fontFamily: 'monospace' }} labelStyle={{ color: '#94a3b8' }} />
                            <Bar dataKey="litrosDiesel" fill="#f59e0b" opacity={0.5} name="Litros Diesel" radius={[2, 2, 0, 0]} />
                            <Line type="monotone" dataKey="co2Kg" stroke="#ef4444" strokeWidth={2} dot={false} name="CO₂ kg" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* Cost chart */}
                <div className="occ-card p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown size={12} className="text-green-400" />
                        <span className="mono-label">Costo Energético (USD) — 30 días</span>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={energyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                            <XAxis dataKey="displayDate" tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} interval={4} />
                            <YAxis tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                            <Tooltip contentStyle={{ background: '#081526', border: '1px solid #163060', borderRadius: 8, fontSize: 10, fontFamily: 'monospace' }} itemStyle={{ color: '#10b981' }} labelStyle={{ color: '#94a3b8' }} />
                            <Area type="monotone" dataKey="costEnergiaUSD" stroke="#10b981" strokeWidth={2} fill="url(#gradCost)" name="Costo USD" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Sustainability metrics */}
                <div className="occ-card p-3">
                    <div className="flex items-center gap-2 mb-3">
                        <Leaf size={12} className="text-green-400" />
                        <span className="mono-label">Sostenibilidad y Comparativas</span>
                    </div>
                    <div className="space-y-3 text-[10px] font-mono">
                        {[
                            { label: 'Intensidad energética eléctrica', value: '6.5 kWh/tren-km', ref: 'Ref UIC: 6.67–8.14', ok: true },
                            { label: 'Consumo diesel específico', value: '2.5 L/tren-km', ref: 'Ref industria: 2.3–3.0', ok: true },
                            { label: 'CO₂ vs auto (pasajeros)', value: '~6× menos', ref: 'Ventaja modal ferrocarril', ok: true },
                            { label: 'Recuperación regenerativa', value: `${totalKwh > 0 ? Math.round(totalRegen / totalKwh * 100) : 12}%`, ref: 'Objetivo: 10–15%', ok: true },
                            { label: 'Costo energía/tren-km', value: '~$0.62 USD', ref: 'Ref: eléctrico 0.08$/kWh', ok: true },
                        ].map(({ label, value, ref, ok }) => (
                            <div key={label} className="flex items-start justify-between gap-3 pb-2 border-b border-occ-700/30 last:border-0">
                                <div>
                                    <p className="text-slate-300">{label}</p>
                                    <p className="text-slate-600 text-[9px]">{ref}</p>
                                </div>
                                <span className={`font-bold flex-shrink-0 ${ok ? 'text-green-400' : 'text-amber-400'}`}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

EnergyView.propTypes = {
    energyData: PropTypes.array,
    kpis:       PropTypes.object,
};

EnergyView.defaultProps = { energyData: [], kpis: {} };
