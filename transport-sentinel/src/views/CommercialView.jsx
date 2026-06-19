import { TrendingUp, Users, Package, DollarSign } from 'lucide-react';
import { SvgAreaChart, SvgBarChart } from '../components/SvgCharts.jsx';
import PropTypes from 'prop-types';

export default function CommercialView({ paxData, cargoData, kpis, fleetType }) {
    const showPax   = fleetType === 'todos' || fleetType === 'pasajeros';
    const showCargo = fleetType === 'todos' || fleetType === 'carga';

    const paxTotal30 = paxData.reduce((s, d) => s + (d.pasajeros || 0), 0);
    const cargoTotal30 = cargoData.reduce((s, d) => s + (d.toneladas || 0), 0);
    const ingrPax = paxData.reduce((s, d) => s + (d.ingresoUSD || 0), 0);
    const ingrCargo = cargoData.reduce((s, d) => s + (d.ingresoUSD || 0), 0);

    // Revenue vs cost bar data (combined pax+cargo per day)
    const revCostBars = paxData.map((d, i) => ({
        label: d.displayDate,
        value: (d.ingresoUSD || 0) + (cargoData[i]?.ingresoUSD || 0),
        color: '#10b981',
    }));

    // Load factor area data — factorCarga field in paxData
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
                            <SvgAreaChart
                                data={paxData}
                                xKey="displayDate"
                                yKey="pasajeros"
                                color="#3b82f6"
                                height={180}
                            />
                        </div>

                        <div className="occ-card p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={12} className="text-green-400" />
                                <span className="mono-label">Factor de Carga (%) — 30 días</span>
                            </div>
                            <SvgAreaChart
                                data={paxData}
                                xKey="displayDate"
                                yKey="factorCarga"
                                color="#10b981"
                                height={180}
                                yMin={40}
                                yMax={100}
                                formatY={v => `${v}%`}
                            />
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
                            <SvgAreaChart
                                data={cargoData}
                                xKey="displayDate"
                                yKey="toneladas"
                                color="#f59e0b"
                                height={180}
                            />
                        </div>

                        <div className="occ-card p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign size={12} className="text-green-400" />
                                <span className="mono-label">Ingresos Diarios (USD) — 30 días</span>
                            </div>
                            <SvgBarChart
                                data={revCostBars}
                                height={180}
                                color="#10b981"
                                showValues={false}
                                formatValue={v => `$${Math.round(v / 1000)}k`}
                            />
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
