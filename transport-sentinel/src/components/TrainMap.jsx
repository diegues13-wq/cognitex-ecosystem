import { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, Marker, InfoWindow } from '@react-google-maps/api';
import PropTypes from 'prop-types';
import { ROUTES } from '../utils/dataGenerator.js';

const MAP_CENTER = { lat: 15, lng: -85 };
const MAP_ZOOM = 3;

const MAP_STYLE = [
    { elementType: 'geometry',                     stylers: [{ color: '#040d1a' }] },
    { elementType: 'labels.text.stroke',            stylers: [{ color: '#020617' }] },
    { elementType: 'labels.text.fill',              stylers: [{ color: '#1d6fa5' }] },
    { featureType: 'road',         elementType: 'geometry',          stylers: [{ color: '#0a1929' }] },
    { featureType: 'road',         elementType: 'labels.text.fill',  stylers: [{ color: '#334155' }] },
    { featureType: 'road.highway', elementType: 'geometry',          stylers: [{ color: '#0d2040' }] },
    { featureType: 'water',        elementType: 'geometry',          stylers: [{ color: '#010b18' }] },
    { featureType: 'water',        elementType: 'labels.text.fill',  stylers: [{ color: '#0a3055' }] },
    { featureType: 'landscape',    elementType: 'geometry',          stylers: [{ color: '#081526' }] },
    { featureType: 'landscape.natural', elementType: 'geometry',     stylers: [{ color: '#061220' }] },
    { featureType: 'poi',                                            stylers: [{ visibility: 'off' }] },
    { featureType: 'transit',                                        stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#0d2040' }] },
    { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#0a1929' }] },
    { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
];

const ROUTE_COLORS = { pasajeros: '#3b82f6', carga: '#f59e0b', mixto: '#a855f7' };
const STATUS_COLOR = { EN_SERVICIO: '#22c55e', EN_MANTENIMIENTO: '#f59e0b', STANDBY: '#475569' };
const STATUS_LABEL = { EN_SERVICIO: 'En Servicio', EN_MANTENIMIENTO: 'Mantenimiento', STANDBY: 'Standby' };

// Icon cache to avoid re-creating google.maps objects each render
const _iconCache = {};
function trainIcon(color) {
    if (!_iconCache[color]) {
        const svg = encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">` +
            `<circle cx="9" cy="9" r="7" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>` +
            `</svg>`
        );
        _iconCache[color] = {
            url: `data:image/svg+xml;charset=UTF-8,${svg}`,
            scaledSize: new window.google.maps.Size(18, 18),
            anchor:     new window.google.maps.Point(9, 9),
        };
    }
    return _iconCache[color];
}

const MAP_OPTIONS = {
    styles:              MAP_STYLE,
    disableDefaultUI:    true,
    zoomControl:         true,
    mapTypeControl:      false,
    streetViewControl:   false,
    fullscreenControl:   false,
    clickableIcons:      false,
};

const CONTAINER_STYLE = { width: '100%', height: '100%' };

export default function TrainMap({ trains }) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'gmap-transport-sentinel',
        googleMapsApiKey: apiKey || '',
    });

    const [selected, setSelected] = useState(null);
    const onUnmount = useCallback(() => {}, []);

    if (!apiKey) return (
        <div className="w-full h-full occ-card rounded-xl flex items-center justify-center">
            <p className="text-slate-500 text-xs font-mono">VITE_GOOGLE_MAPS_API_KEY no configurada</p>
        </div>
    );

    if (loadError) return (
        <div className="w-full h-full occ-card rounded-xl flex items-center justify-center">
            <p className="text-red-400 text-xs font-mono">Error al cargar Google Maps — verificar API key</p>
        </div>
    );

    if (!isLoaded) return (
        <div className="w-full h-full occ-card rounded-xl flex items-center justify-center">
            <div className="text-center space-y-2">
                <div className="w-6 h-6 border-2 border-rail/40 border-t-rail rounded-full animate-spin mx-auto" />
                <p className="text-slate-500 text-xs font-mono">Cargando mapa…</p>
            </div>
        </div>
    );

    return (
        <div className="w-full h-full rounded-xl overflow-hidden relative">
            <GoogleMap
                mapContainerStyle={CONTAINER_STYLE}
                center={MAP_CENTER}
                zoom={MAP_ZOOM}
                options={MAP_OPTIONS}
                onUnmount={onUnmount}
            >
                {/* Rutas ferroviarias */}
                {ROUTES.map(route => (
                    <Polyline
                        key={route.id}
                        path={route.stops.map(s => ({ lat: s.lat, lng: s.lng }))}
                        options={{
                            strokeColor:   ROUTE_COLORS[route.type] || '#3b82f6',
                            strokeOpacity: 0.75,
                            strokeWeight:  route.type === 'carga' ? 2 : 3,
                        }}
                    />
                ))}

                {/* Trenes — marcadores en posición real */}
                {trains.map(train => (
                    <Marker
                        key={train.id}
                        position={{ lat: train.lat, lng: train.lng }}
                        icon={trainIcon(STATUS_COLOR[train.status] || '#475569')}
                        title={`${train.callsign} — ${train.name}`}
                        onClick={() => setSelected(train)}
                    />
                ))}

                {/* Info window al seleccionar un tren */}
                {selected && (
                    <InfoWindow
                        position={{ lat: selected.lat, lng: selected.lng }}
                        onCloseClick={() => setSelected(null)}
                        options={{ pixelOffset: new window.google.maps.Size(0, -12) }}
                    >
                        <div style={{
                            background: '#081526', border: '1px solid #1d6fa5',
                            borderRadius: '8px', padding: '8px 12px', minWidth: '175px',
                            fontFamily: 'ui-monospace, monospace',
                        }}>
                            <p style={{ color: '#38a8e0', fontSize: '11px', fontWeight: 'bold', margin: '0 0 2px' }}>
                                {selected.id} · {selected.callsign}
                            </p>
                            <p style={{ color: '#e2e8f0', fontSize: '10px', margin: '0 0 1px' }}>{selected.name}</p>
                            <p style={{ color: '#475569', fontSize: '9px', margin: '0 0 7px' }}>{selected.routeName}</p>
                            <div style={{
                                borderTop: '1px solid #0d2040', paddingTop: '5px',
                                display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 10px',
                            }}>
                                <span style={{ color: '#475569', fontSize: '9px' }}>Estado</span>
                                <span style={{ color: STATUS_COLOR[selected.status], fontSize: '9px', fontWeight: 'bold' }}>
                                    {STATUS_LABEL[selected.status]}
                                </span>
                                <span style={{ color: '#475569', fontSize: '9px' }}>Velocidad</span>
                                <span style={{ color: '#e2e8f0', fontSize: '9px' }}>{selected.speed ?? 0} km/h</span>
                                {selected.occupancy != null && <>
                                    <span style={{ color: '#475569', fontSize: '9px' }}>Ocupación</span>
                                    <span style={{ color: '#e2e8f0', fontSize: '9px' }}>{selected.occupancy}%</span>
                                </>}
                                {selected.tonsLoaded != null && <>
                                    <span style={{ color: '#475569', fontSize: '9px' }}>Toneladas</span>
                                    <span style={{ color: '#e2e8f0', fontSize: '9px' }}>{selected.tonsLoaded} t</span>
                                </>}
                                {(selected.delayMin ?? 0) > 3 && <>
                                    <span style={{ color: '#475569', fontSize: '9px' }}>Retraso</span>
                                    <span style={{ color: '#f59e0b', fontSize: '9px', fontWeight: 'bold' }}>+{selected.delayMin} min</span>
                                </>}
                            </div>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>

            {/* Leyenda superpuesta */}
            <div style={{
                position: 'absolute', bottom: '8px', left: '8px',
                display: 'flex', gap: '5px', flexWrap: 'wrap', pointerEvents: 'none',
            }}>
                {[
                    ['dot', '#22c55e', 'Servicio'],
                    ['dot', '#f59e0b', 'Mantenimiento'],
                    ['dot', '#475569', 'Standby'],
                    ['line', '#3b82f6', 'Pasajeros'],
                    ['line', '#f59e0b', 'Carga'],
                    ['line', '#a855f7', 'Mixto'],
                ].map(([kind, color, label]) => (
                    <div key={label} style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        background: 'rgba(4,13,26,0.90)', border: '1px solid #0d2040',
                        borderRadius: '5px', padding: '2px 7px',
                    }}>
                        {kind === 'dot'
                            ? <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: color }} />
                            : <div style={{ width: '11px', height: '2.5px', background: color, borderRadius: '1px' }} />
                        }
                        <span style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '9px' }}>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

TrainMap.propTypes = { trains: PropTypes.array };
TrainMap.defaultProps = { trains: [] };
