import { useState, useEffect, lazy, Suspense } from 'react';
import { AlertTriangle, Clock, Train, Activity, CheckCircle } from 'lucide-react';
import PropTypes from 'prop-types';

// Both map and graph are lazy — separate chunks, compiled only when rendered
const TrainMap   = lazy(() => import('../components/TrainMap.jsx'));
const TrainGraph = lazy(() => import('../components/TrainGraph.jsx'));

const STATUS_CONFIG = {
    EN_SERVICIO:      { label: 'En Servicio',    color: 'text-green-400',  dot: 'bg-green-400' },
    EN_MANTENIMIENTO: { label: 'Mantenimiento',  color: 'text-amber-400',  dot: 'bg-amber-400' },
    STANDBY:          { label: 'Standby',         color: 'text-slate-400',  dot: 'bg-slate-500' },
};

export default function CCOView({ snapshot, alerts, kpis, fleetType }) {
    const [schedule, setSchedule] = useState(null);
    const [selectedRoute, setSelectedRoute] = useState('RT-001');
    const [loadingSchedule, setLoadingSchedule] = useState(true);
    const [routes, setRoutes] = useState([]);

    useEffect(() => {
        import('../services/api.js').then(({ fetchRoutes }) => fetchRoutes()).then(setRoutes);
    }, []);

    useEffect(() => {
        setLoadingSchedule(true);
        import('../services/api.js').then(({ fetchTrainSchedule }) =>
            fetchTrainSchedule(selectedRoute)
        ).then(s => {
            setSchedule(s);
            setLoadingSchedule(false);
        });
    }, [selectedRoute]);

    const activeTrains = snapshot.filter(t => t.status === 'EN_SERVICIO');
    const criticalAlerts = alerts.filter(a => a.priority === 'CRITICAL');
    const openIncidents = 1; // from INC-2026-0087

    // Status grouping
    const byStatus = {
        EN_SERVICIO:      snapshot.filter(t => t.status === 'EN_SERVICIO').length,
        EN_MANTENIMIENTO: snapshot.filter(t => t.status === 'EN_MANTENIMIENTO').length,
        STANDBY:          snapshot.filter(t => t.status === 'STANDBY').length,
    };

    // Next departures (next 60 min simulated)
    const nextDeps = activeTrains.slice(0, 5).map((t, i) => ({
        trainId: t.id,
        name: t.name,
        route: t.routeName,
        depTime: new Date(Date.now() + (i * 12 + 3) * 60000).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
        delay: t.delayMin,
    }));

    return (
        <div className="h-full flex flex-col gap-3 overflow-hidden">
            {/* Top row: fleet status pills */}
            <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Estado Flota:</span>
                {Object.entries(byStatus).map(([status, count]) => {
                    const cfg = STATUS_CONFIG[status];
                    return (
                        <div key={status} className="flex items-center gap-1.5 bg-occ-800/50 rounded-lg px-2.5 py-1.5 border border-occ-700/40">
                            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                            <span className={`text-[10px] font-mono font-bold ${cfg.color}`}>{count}</span>
                            <span className="text-[9px] font-mono text-slate-500">{cfg.label}</span>
                        </div>
                    );
                })}
                <div className="ml-auto flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1.5 rounded-lg border ${openIncidents > 0 ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-green-400 border-green-500/30 bg-green-500/10'}`}>
                        {openIncidents > 0 ? <AlertTriangle size={10} /> : <CheckCircle size={10} />}
                        {openIncidents > 0 ? `${openIncidents} incidente abierto` : 'Sin incidentes'}
                    </div>
                </div>
            </div>

            {/* Main layout: left map+graph, right panel */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3 min-h-0">
                {/* LEFT: Map + Train Graph */}
                <div className="flex flex-col gap-3 min-h-0">
                    {/* Map */}
                    <div className="flex-1 min-h-[280px]">
                        <Suspense fallback={<div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono bg-occ-900/50 rounded-xl">Cargando mapa…</div>}>
                            <TrainMap trains={snapshot} fleetType={fleetType} />
                        </Suspense>
                    </div>

                    {/* Train Graph */}
                    <div className="occ-card p-3 flex-shrink-0">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-mono text-rail-glow font-bold tracking-widest">GRÁFICO TREN —</span>
                            <select
                                value={selectedRoute}
                                onChange={e => setSelectedRoute(e.target.value)}
                                className="bg-occ-700/50 border border-occ-700/40 text-slate-300 text-[10px] font-mono rounded px-2 py-0.5 outline-none cursor-pointer"
                            >
                                {routes.filter(r => r.type !== 'carga').map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                        {loadingSchedule
                            ? <div className="h-32 flex items-center justify-center text-slate-500 text-xs font-mono">Cargando horario…</div>
                            : <Suspense fallback={<div className="h-32 flex items-center justify-center text-slate-500 text-xs font-mono">Cargando gráfico…</div>}>
                                <TrainGraph routeId={selectedRoute} schedule={schedule} trains={snapshot} />
                              </Suspense>
                        }
                    </div>
                </div>

                {/* RIGHT: Status panels */}
                <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
                    {/* KPI mini strip */}
                    <div className="occ-card p-3 grid grid-cols-2 gap-2 flex-shrink-0">
                        <div className="text-center">
                            <p className="text-[8px] font-mono text-slate-500 uppercase">OTP</p>
                            <p className={`text-xl font-bold font-mono ${kpis.otp >= 85 ? 'text-green-400' : 'text-amber-400'}`}>{kpis.otp ?? '—'}%</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] font-mono text-slate-500 uppercase">Disponib.</p>
                            <p className={`text-xl font-bold font-mono ${kpis.ramsDisponibilidad >= 90 ? 'text-green-400' : 'text-amber-400'}`}>{kpis.ramsDisponibilidad ?? '—'}%</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] font-mono text-slate-500 uppercase">Km Hoy</p>
                            <p className="text-lg font-bold font-mono text-rail-glow">{kpis.kmTotales ?? '—'}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] font-mono text-slate-500 uppercase">Incidentes</p>
                            <p className={`text-xl font-bold font-mono ${kpis.incidentesHoy === 0 ? 'text-green-400' : 'text-red-400'}`}>{kpis.incidentesHoy ?? 0}</p>
                        </div>
                    </div>

                    {/* Active Alerts */}
                    <div className="occ-card p-3 flex-shrink-0">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle size={11} className="text-amber-400" />
                            <span className="text-[10px] font-mono font-bold text-amber-400 tracking-widest">ALERTAS ACTIVAS</span>
                            <span className="ml-auto text-[9px] font-mono bg-amber-500/20 text-amber-400 px-1.5 rounded">{criticalAlerts.length} críticas</span>
                        </div>
                        <div className="space-y-2 max-h-52 overflow-y-auto">
                            {alerts.slice(0, 6).map(alert => (
                                <div key={alert.id} className={`text-[10px] font-mono rounded-lg p-2 border ${alert.priority === 'CRITICAL' ? 'border-red-500/30 bg-red-500/8 text-red-300' : alert.priority === 'WARNING' ? 'border-amber-500/25 bg-amber-500/8 text-amber-300' : 'border-occ-700/30 bg-occ-800/30 text-slate-400'}`}>
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <span className="font-bold">{alert.time}</span>
                                        {alert.trainId && <span className="text-rail-glow">[{alert.trainId}]</span>}
                                    </div>
                                    <p className="leading-tight line-clamp-2">{alert.message}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Next departures */}
                    <div className="occ-card p-3 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock size={11} className="text-rail-glow" />
                            <span className="text-[10px] font-mono font-bold text-rail-glow tracking-widest">PRÓXIMAS SALIDAS</span>
                        </div>
                        <div className="space-y-2">
                            {nextDeps.map((dep, i) => (
                                <div key={i} className="flex items-center justify-between gap-2 text-[10px] font-mono border-b border-occ-700/30 pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <Train size={9} className="text-rail flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-slate-200 truncate leading-tight text-[9px]">{dep.name}</p>
                                            <p className="text-slate-600 truncate text-[8px]">{dep.route}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-slate-200 font-bold">{dep.depTime}</p>
                                        {dep.delay > 3 && <p className="text-amber-400 text-[8px]">+{dep.delay}m</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

CCOView.propTypes = {
    snapshot:  PropTypes.array,
    alerts:    PropTypes.array,
    kpis:      PropTypes.object,
    fleetType: PropTypes.string,
};

CCOView.defaultProps = {
    snapshot:  [],
    alerts:    [],
    kpis:      {},
    fleetType: 'todos',
};
