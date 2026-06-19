import { useState } from 'react';
import { Train, Zap, Fuel, Activity } from 'lucide-react';
import PropTypes from 'prop-types';
import AssetCard from '../components/AssetCard.jsx';
import { SvgAreaChart } from '../components/SvgCharts.jsx';

const TRACTION_ICONS = { electrico: Zap, diesel: Fuel, hibrido: Activity };

export default function FleetView({ snapshot, history, onSelectTrain, selectedTrain }) {
    const [filterType, setFilterType] = useState('todos');
    const [filterStatus, setFilterStatus] = useState('todos');

    const filtered = snapshot.filter(t => {
        if (filterType !== 'todos' && t.type !== filterType) return false;
        if (filterStatus !== 'todos' && t.status !== filterStatus) return false;
        return true;
    });

    const selected = snapshot.find(t => t.id === selectedTrain) || snapshot[0];
    const TractIcon = selected ? (TRACTION_ICONS[selected.traction] || Train) : Train;

    const maintUrgencyColor = {
        CRITICA: 'text-red-400 bg-red-500/10 border-red-500/30',
        PROXIMA: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        OK:      'text-green-400 bg-green-500/10 border-green-500/30',
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-3 overflow-hidden min-h-0">
            {/* LEFT: Asset list */}
            <div className="flex flex-col gap-2 min-h-0">
                {/* Filters */}
                <div className="flex gap-2 flex-shrink-0">
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="flex-1 bg-occ-800/80 border border-occ-700/40 text-slate-300 text-[10px] font-mono rounded-lg px-2 py-1.5 outline-none"
                    >
                        <option value="todos">Todos los tipos</option>
                        <option value="pasajeros">Pasajeros</option>
                        <option value="carga">Carga</option>
                    </select>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="flex-1 bg-occ-800/80 border border-occ-700/40 text-slate-300 text-[10px] font-mono rounded-lg px-2 py-1.5 outline-none"
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="EN_SERVICIO">En Servicio</option>
                        <option value="EN_MANTENIMIENTO">Mantenimiento</option>
                        <option value="STANDBY">Standby</option>
                    </select>
                </div>

                {/* Counts */}
                <div className="flex gap-2 text-[9px] font-mono text-slate-500 flex-shrink-0 px-1">
                    <span>{filtered.length} activos</span>
                    <span className="text-green-400">{filtered.filter(t => t.status === 'EN_SERVICIO').length} en servicio</span>
                    <span className="text-amber-400">{filtered.filter(t => t.status === 'EN_MANTENIMIENTO').length} en mant.</span>
                </div>

                {/* Train list */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {filtered.map(train => (
                        <AssetCard
                            key={train.id}
                            train={train}
                            isSelected={selectedTrain === train.id}
                            onClick={() => onSelectTrain(train.id)}
                        />
                    ))}
                </div>
            </div>

            {/* RIGHT: Detail panel */}
            {selected && (
                <div className="flex flex-col gap-3 overflow-y-auto min-h-0">
                    {/* Header */}
                    <div className="occ-card p-4 flex-shrink-0">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <TractIcon size={16} className="text-rail-glow" />
                                    <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                                    <span className="text-[9px] font-mono bg-occ-700/50 text-slate-400 px-2 py-0.5 rounded">{selected.callsign}</span>
                                </div>
                                <p className="text-xs font-mono text-slate-500">{selected.manufacturer} {selected.model} · {selected.yearBuilt}</p>
                            </div>
                            <div className={`text-[9px] font-mono font-bold px-2 py-1 rounded-lg border ${maintUrgencyColor[selected.maintUrgency]}`}>
                                MANT: {selected.maintUrgency}
                            </div>
                        </div>

                        {/* Specs grid */}
                        <div className="grid grid-cols-3 gap-3 text-[10px] font-mono">
                            {[
                                { label: 'Tracción',    value: selected.traction },
                                { label: 'Depósito',    value: selected.depot },
                                { label: 'Tipo',        value: selected.type },
                                { label: 'Velocidad máx', value: `${selected.maxSpeedKmh} km/h` },
                                { label: 'Potencia',    value: `${selected.powerKw?.toLocaleString()} kW` },
                                { label: 'Masa',        value: `${selected.weightTons} t` },
                                { label: 'Longitud',    value: `${selected.lengthM} m` },
                                { label: 'Ejes',        value: selected.axleCount },
                                { label: 'Capacidad',   value: `${selected.capacity} ${selected.type === 'carga' ? 't' : 'pax'}` },
                            ].map(({ label, value }) => (
                                <div key={label} className="bg-occ-900/50 rounded-lg p-2 border border-occ-700/30">
                                    <p className="text-slate-600 text-[8px] uppercase">{label}</p>
                                    <p className="text-slate-200 font-bold capitalize mt-0.5">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Odometer + maintenance */}
                    <div className="occ-card p-3 flex-shrink-0">
                        <p className="mono-label mb-2">Odómetro y Mantenimiento</p>
                        <div className="flex items-center gap-4 mb-3">
                            <div>
                                <p className="text-[9px] font-mono text-slate-500">Km Totales</p>
                                <p className="text-2xl font-bold font-mono text-rail-glow">{selected.odometer?.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-mono text-slate-500">Próximo Mantenimiento</p>
                                <p className="text-2xl font-bold font-mono text-white">{selected.nextMaintKm?.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-mono text-slate-500">Km Restantes</p>
                                <p className={`text-2xl font-bold font-mono ${selected.kmToNextMaint < 2000 ? 'text-red-400' : selected.kmToNextMaint < 10000 ? 'text-amber-400' : 'text-green-400'}`}>
                                    {selected.kmToNextMaint?.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="h-1.5 bg-occ-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${selected.kmToNextMaint < 2000 ? 'bg-red-500' : selected.kmToNextMaint < 10000 ? 'bg-amber-400' : 'bg-rail'}`}
                                style={{ width: `${Math.min(100, Math.round((selected.odometer / selected.nextMaintKm) * 100))}%` }}
                            />
                        </div>
                    </div>

                    {/* Current trip stats */}
                    <div className="occ-card p-3 flex-shrink-0">
                        <p className="mono-label mb-2">Estado del Viaje Actual</p>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-occ-900/40 rounded-lg p-2 text-center">
                                <p className="text-[8px] font-mono text-slate-500">Velocidad</p>
                                <p className="text-lg font-bold font-mono text-white">{selected.speed} <span className="text-xs text-slate-500">km/h</span></p>
                            </div>
                            <div className={`bg-occ-900/40 rounded-lg p-2 text-center ${selected.delayMin > 3 ? 'border border-amber-500/30' : ''}`}>
                                <p className="text-[8px] font-mono text-slate-500">Retraso</p>
                                <p className={`text-lg font-bold font-mono ${selected.delayMin <= 3 ? 'text-green-400' : 'text-amber-400'}`}>
                                    {selected.delayMin <= 0 ? 'A tiempo' : `+${selected.delayMin}m`}
                                </p>
                            </div>
                            {selected.type === 'pasajeros'
                                ? <div className="bg-occ-900/40 rounded-lg p-2 text-center">
                                    <p className="text-[8px] font-mono text-slate-500">Ocupación</p>
                                    <p className={`text-lg font-bold font-mono ${selected.occupancy > 85 ? 'text-amber-400' : 'text-white'}`}>{selected.occupancy}%</p>
                                  </div>
                                : <div className="bg-occ-900/40 rounded-lg p-2 text-center">
                                    <p className="text-[8px] font-mono text-slate-500">Carga</p>
                                    <p className="text-lg font-bold font-mono text-white">{selected.tonsLoaded?.toLocaleString()}t</p>
                                  </div>
                            }
                        </div>
                    </div>

                    {/* OTP chart from history */}
                    {history && history.length > 0 && (
                        <div className="occ-card p-3">
                            <p className="mono-label mb-2">OTP — Últimos 30 días</p>
                            <SvgAreaChart
                                data={history}
                                xKey="displayDate"
                                yKey="otp"
                                color="#1d6fa5"
                                height={120}
                                yMin={60}
                                yMax={100}
                                formatY={v => `${v}%`}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

FleetView.propTypes = {
    snapshot:      PropTypes.array,
    history:       PropTypes.array,
    onSelectTrain: PropTypes.func,
    selectedTrain: PropTypes.string,
};

FleetView.defaultProps = {
    snapshot:      [],
    history:       [],
    onSelectTrain: () => {},
};
