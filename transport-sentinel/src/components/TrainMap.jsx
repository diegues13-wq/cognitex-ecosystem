import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import PropTypes from 'prop-types';
import { ROUTES } from '../utils/dataGenerator.js';

// Fix Leaflet default icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const STATUS_STYLES = {
    EN_SERVICIO:      { fill: '#22c55e', border: '#4ade80', glow: 'rgba(34,197,94,0.8)' },
    EN_MANTENIMIENTO: { fill: '#f59e0b', border: '#fbbf24', glow: 'rgba(245,158,11,0.8)' },
    STANDBY:          { fill: '#64748b', border: '#94a3b8', glow: 'rgba(100,116,139,0.6)' },
};

const ROUTE_COLORS = {
    'RT-001': '#38a8e0',
    'RT-002': '#1d6fa5',
    'RT-003': '#3b82f6',
    'RT-004': '#f59e0b',
    'RT-005': '#f97316',
    'RT-006': '#a855f7',
};

function createTrainIcon(train) {
    const sc = STATUS_STYLES[train.status] || STATUS_STYLES.STANDBY;
    const isPax = train.type === 'pasajeros';
    const size = isPax ? 14 : 12;

    return L.divIcon({
        html: `
            <div style="
                width:${size}px;height:${size}px;border-radius:50%;
                background:${sc.fill};border:2px solid ${sc.border};
                box-shadow:0 0 8px ${sc.glow},0 0 16px ${sc.glow}40;
                position:relative;
            ">
                ${train.delayMin > 3 ? `<div style="position:absolute;top:-3px;right:-3px;width:6px;height:6px;background:#ef4444;border-radius:50%;border:1px solid #fca5a5;"></div>` : ''}
            </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        className: '',
    });
}

function createStationIcon() {
    return L.divIcon({
        html: `<div style="width:6px;height:6px;border-radius:50%;background:#1d6fa5;border:1.5px solid #38a8e0;"></div>`,
        iconSize: [6, 6],
        iconAnchor: [3, 3],
        className: '',
    });
}

function RecenterMap({ center }) {
    const map = useMap();
    useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
    return null;
}

export default function TrainMap({ trains = [], fleetType = 'todos' }) {
    const center = [10.2, -67.8];
    const stationIcon = createStationIcon();
    const filtered = fleetType === 'todos' ? trains : trains.filter(t => t.type === fleetType);

    // Build route polylines from ROUTES static data
    const routeLines = ROUTES.map(route => ({
        id: route.id,
        color: ROUTE_COLORS[route.id] || '#1d6fa5',
        positions: route.stops.map(s => [s.lat, s.lng]),
        stations: route.stops,
        name: route.name,
        type: route.type,
    }));

    const visibleRoutes = fleetType === 'todos' ? routeLines
        : routeLines.filter(r => r.type === fleetType || r.type === 'mixto');

    return (
        <div className="relative w-full h-full rounded-xl overflow-hidden border border-occ-700/40">
            {/* Map overlay header */}
            <div className="absolute top-3 left-3 z-[400] bg-occ-900/90 px-3 py-1.5 rounded-lg backdrop-blur border border-occ-700/40 shadow-lg">
                <div className="flex items-center gap-2">
                    <MapPin size={11} className="text-rail-glow" />
                    <span className="text-[10px] font-mono font-bold text-rail-glow tracking-widest uppercase">Posiciones en Tiempo Real</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[9px] font-mono text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> En servicio</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Mantenimiento</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" /> Standby</span>
                </div>
            </div>

            {/* Train count badge */}
            <div className="absolute top-3 right-3 z-[400] bg-occ-900/90 px-2.5 py-1 rounded-lg backdrop-blur border border-occ-700/40">
                <span className="text-[10px] font-mono text-slate-300">
                    <span className="text-green-400 font-bold">{filtered.filter(t => t.status === 'EN_SERVICIO').length}</span>
                    <span className="text-slate-600"> / {filtered.length} trenes</span>
                </span>
            </div>

            <MapContainer
                center={center}
                zoom={7}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                {/* Route lines */}
                {visibleRoutes.map(route => (
                    <Polyline
                        key={route.id}
                        positions={route.positions}
                        pathOptions={{
                            color: route.color,
                            weight: 2.5,
                            opacity: 0.7,
                            dashArray: route.type === 'carga' ? '6 4' : null,
                        }}
                    />
                ))}

                {/* Station markers */}
                {visibleRoutes.flatMap(route =>
                    route.stations.map(s => (
                        <Marker key={`${route.id}-${s.id}`} position={[s.lat, s.lng]} icon={stationIcon}>
                            <Popup>
                                <div className="text-xs">
                                    <p className="font-bold">{s.name}</p>
                                    <p className="text-slate-400">{route.name} · {s.km} km</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))
                )}

                {/* Train markers */}
                {filtered.map(train => (
                    <Marker
                        key={train.id}
                        position={[train.lat, train.lng]}
                        icon={createTrainIcon(train)}
                    >
                        <Popup maxWidth={220}>
                            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#e2e8f0', minWidth: '180px' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px', color: '#38a8e0' }}>
                                    {train.name}
                                </div>
                                <div style={{ color: '#94a3b8', marginBottom: '2px' }}>{train.callsign} · {train.model}</div>
                                <hr style={{ border: 'none', borderTop: '1px solid #163060', margin: '6px 0' }} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }}>
                                    <span style={{ color: '#64748b' }}>Estado:</span>
                                    <span style={{ color: STATUS_STYLES[train.status]?.fill || '#94a3b8' }}>{train.status?.replace('_', ' ')}</span>
                                    <span style={{ color: '#64748b' }}>Ruta:</span>
                                    <span>{train.routeName || train.route}</span>
                                    <span style={{ color: '#64748b' }}>Velocidad:</span>
                                    <span>{train.speed} km/h</span>
                                    {train.type === 'pasajeros' && train.occupancy !== null && (
                                        <><span style={{ color: '#64748b' }}>Ocupación:</span><span>{train.occupancy}%</span></>
                                    )}
                                    {train.type === 'carga' && train.tonsLoaded !== null && (
                                        <><span style={{ color: '#64748b' }}>Carga:</span><span>{train.tonsLoaded?.toLocaleString()} t</span></>
                                    )}
                                    {train.delayMin > 0 && (
                                        <><span style={{ color: '#64748b' }}>Retraso:</span><span style={{ color: '#f59e0b' }}>+{train.delayMin} min</span></>
                                    )}
                                    <span style={{ color: '#64748b' }}>Km mant.:</span>
                                    <span style={{ color: train.maintUrgency === 'CRITICA' ? '#ef4444' : train.maintUrgency === 'PROXIMA' ? '#f59e0b' : '#4ade80' }}>
                                        {train.kmToNextMaint?.toLocaleString()} km
                                    </span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <RecenterMap center={center} />
            </MapContainer>
        </div>
    );
}

TrainMap.propTypes = {
    trains:    PropTypes.array,
    fleetType: PropTypes.string,
};
