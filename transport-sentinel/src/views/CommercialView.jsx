import { TrendingUp, Users, Package, DollarSign } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import PropTypes from 'prop-types';

export default function CommercialView({ paxData, cargoData, kpis, fleetType }) {
    const showPax   = fleetType === 'todos' || fleetType === 'pasajeros';
    const showCargo = fleetType === 'todos' || fleetType === 'carga';

    const paxTotal30 = paxData.reduce((s, d) => s + (d.pasajeros || 0), 0);
    const cargoTotal30 = cargoData.reduce((s, d) => s + (d.toneladas || 0), 0);
    const ingrPax = paxData.reduce((s, d) => s + (d.ingresoUSD || 0), 0);
    const ingrCargo = cargoData.reduce((s, d) => s + (d.ingresoUSD || 0), 0);

    return (
        <div className="h-full overflow-y-auto space-y-3 pr-1">
            {/* KPI strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {showPax && (
                    <>
                        <div className="occ-card p-3">
                            <p className="mono-label flex items-center gap-1"><Users size={10} /> Pasajeros (30d)</p>
                            <p className="text-2xl font-bold font-mono text-blue-400 mt-1">{paxTotal30.toLocaleString()}</p>
                            <p className="text-[9px] font-mono text-slate-600">{kpis.factorCarga ?? '—'}% factor carga</p>
                        </div>
                        <div className="occ-card p-3">
                            <p className="mono-label flex items-center gap-1"><DollarSign size={10} /> Ingreso Pax (30d)</p>
                            <p className="text-2xl font-bold font-mono text-green-400 mt-1">${ingrPax.toLocaleString()}</p>
                            <p className="text-[9px] font-mono text-slate-600">USD estimado</p>
                        </div>
                    </>
                )}
                {showCargo && (
                    <>
                        <div className="occ-card p-3">
                            <p className="mono-label flex items-center gap-1"><Package size={10} /> Toneladas (30d)</p>
                            <p className="text-2xl font-bold font-mono text-amber-400 mt-1">{cargoTotal30.toLocaleString()}</p>
                            <p className="text-[9px] font-mono text-slate-600">ton transportadas</p>
                        </div>
                        <div className="occ-card p-3">
                            <p className="mono-label flex items-center gap-1"><DollarSign size={10} /> Ingreso Carga (30d)</p>
                            <p className="text-2xl font-bold font-mono text-green-400 mt-1">${ingrCargo.toLocaleString()}</p>
                            <p className="text-[9px] font-mono text-slate-600">USD estimado</p>
                        </div>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Passenger charts */}
                {showPax && (
                    <>
                        <div className="occ-card p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Users size={12} className="text-blue-400" />
                                <span className="mono-label">Pasajeros Diarios — 30 días</span>
                            </div>
                            <ResponsiveContainer width="100%" height={180}>
                                <AreaChart data={paxData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradPax" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                                    <XAxis dataKey="displayDate" tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} interval={4} />
                                    <YAxis tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                                    <Tooltip contentStyle={{ background: '#081526', border: '1px solid #163060', borderRadius: 8, fontSize: 10, fontFamily: 'monospace' }} itemStyle={{ color: '#60a5fa' }} labelStyle={{ color: '#94a3b8' }} />
                                    <Area type="monotone" dataKey="pasajeros" stroke="#3b82f6" strokeWidth={2} fill="url(#gradPax)" name="Pasajeros" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="occ-card p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={12} className="text-green-400" />
                                <span className="mono-label">Factor de Carga (%) — 30 días</span>
                            </div>
                            <ResponsiveContainer width="100%" height={180}>
                                <ComposedChart data={paxData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                                    <XAxis dataKey="displayDate" tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} interval={4} />
                                    <YAxis tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} domain={[40, 100]} />
                                    <Tooltip contentStyle={{ background: '#081526', border: '1px solid #163060', borderRadius: 8, fontSize: 10, fontFamily: 'monospace' }} itemStyle={{ color: '#10b981' }} labelStyle={{ color: '#94a3b8' }} />
                                    <Bar dataKey="factorCarga" fill="#1d6fa5" opacity={0.3} name="Factor Carga %" radius={[2, 2, 0, 0]} />
                                    <Line type="monotone" dataKey="factorCarga" stroke="#10b981" strokeWidth={2} dot={false} name="Factor Carga %" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}

                {/* Cargo charts */}
                {showCargo && (
                    <>
                        <div className="occ-card p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Package size={12} className="text-amber-400" />
                                <span className="mono-label">Toneladas Transportadas — 30 días</span>
                            </div>
                            <ResponsiveContainer width="100%" height={180}>
                                <AreaChart data={cargoData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradTons" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                                    <XAxis dataKey="displayDate" tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} interval={4} />
                                    <YAxis tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                                    <Tooltip contentStyle={{ background: '#081526', border: '1px solid #163060', borderRadius: 8, fontSize: 10, fontFamily: 'monospace' }} itemStyle={{ color: '#fbbf24' }} labelStyle={{ color: '#94a3b8' }} />
                                    <Area type="monotone" dataKey="toneladas" stroke="#f59e0b" strokeWidth={2} fill="url(#gradTons)" name="Toneladas" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="occ-card p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign size={12} className="text-green-400" />
                                <span className="mono-label">Ingresos vs Costos (USD) — 30 días</span>
                            </div>
                            <ResponsiveContainer width="100%" height={180}>
                                <ComposedChart data={[...paxData.map((d, i) => ({ displayDate: d.displayDate, ingreso: (d.ingresoUSD || 0) + (cargoData[i]?.ingresoUSD || 0), costo: (d.costoOperUSD || 0) + (cargoData[i]?.costoOperUSD || 0) }))]} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                                    <XAxis dataKey="displayDate" tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} interval={4} />
                                    <YAxis tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                                    <Tooltip contentStyle={{ background: '#081526', border: '1px solid #163060', borderRadius: 8, fontSize: 10, fontFamily: 'monospace' }} labelStyle={{ color: '#94a3b8' }} />
                                    <Bar dataKey="ingreso" fill="#10b981" opacity={0.4} name="Ingreso $" radius={[2, 2, 0, 0]} />
                                    <Line type="monotone" dataKey="costo" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Costo $" strokeDasharray="4 3" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

CommercialView.propTypes = {
    paxData:   PropTypes.array,
    cargoData: PropTypes.array,
    kpis:      PropTypes.object,
    fleetType: PropTypes.string,
};

CommercialView.defaultProps = { paxData: [], cargoData: [], kpis: {}, fleetType: 'todos' };
