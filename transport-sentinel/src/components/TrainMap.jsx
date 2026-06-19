import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// ── Dark map styles (OCC navy theme) ────────────────────────────────────────────
const MAP_STYLES = [
    { elementType: 'geometry',                                                stylers: [{ color: '#0a1929' }] },
    { elementType: 'labels',                                                  stylers: [{ visibility: 'off' }] },
    { featureType: 'water',         elementType: 'geometry',                  stylers: [{ color: '#010b18' }] },
    { featureType: 'landscape',     elementType: 'geometry',                  stylers: [{ color: '#061220' }] },
    { featureType: 'road',          elementType: 'geometry',                  stylers: [{ color: '#0d2040' }] },
    { featureType: 'road.highway',  elementType: 'geometry',                  stylers: [{ color: '#162a45' }] },
    { featureType: 'poi',                                                     stylers: [{ visibility: 'off' }] },
    { featureType: 'transit',                                                 stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative.country',  elementType: 'geometry.stroke', stylers: [{ color: '#1d3a5c' }, { weight: 1 }] },
    { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#0d2040' }, { weight: 0.5 }] },
];

const STATUS_COLOR = { EN_SERVICIO: '#22c55e', EN_MANTENIMIENTO: '#f59e0b', STANDBY: '#475569' };
const STATUS_LABEL = { EN_SERVICIO: 'En Servicio', EN_MANTENIMIENTO: 'Mantenimiento', STANDBY: 'Standby' };
const ROUTE_COLOR  = { pasajeros: '#3b82f6', carga: '#f59e0b', mixto: '#a855f7' };

// ── Singleton loader — loads the Maps JS SDK once ───────────────────────────────
let _mapsPromise = null;

function loadMapsAPI(apiKey) {
    if (window.google?.maps) return Promise.resolve(window.google.maps);
    if (_mapsPromise)         return _mapsPromise;

    _mapsPromise = new Promise((resolve, reject) => {
        const cbName = '__gmaps_init_' + Date.now();
        window[cbName] = () => { resolve(window.google.maps); delete window[cbName]; };
        const script = document.createElement('script');
        script.src   = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${cbName}`;
        script.async = true;
        script.defer = true;
        script.onerror = (err) => { _mapsPromise = null; reject(err); };
        document.head.appendChild(script);
    });

    return _mapsPromise;
}

function trainInfoHTML(t) {
    const color    = STATUS_COLOR[t.status] || '#475569';
    const label    = STATUS_LABEL[t.status] || t.status;
    const hasDelay = (t.delayMin ?? 0) > 3;
    return `<div style="font-family:monospace;background:#081526;color:#e2e8f0;padding:10px 12px;border-radius:8px;border:1px solid #1d3a5c;min-width:175px;font-size:11px;">
        <div style="color:#38a8e0;font-weight:bold;margin-bottom:2px;">${t.id} · ${t.callsign}</div>
        <div style="margin-bottom:1px;">${t.name}</div>
        <div style="color:#475569;font-size:10px;margin-bottom:6px;">${t.routeName || '—'}</div>
        <hr style="border:none;border-top:1px solid #0d2040;margin:0 0 5px"/>
        <div style="display:flex;justify-content:space-between;margin-bottom:3px;"><span style="color:#64748b;">Estado</span><span style="color:${color};font-weight:bold;">${label}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:3px;"><span style="color:#64748b;">Velocidad</span><span>${t.speed ?? 0} km/h</span></div>
        ${t.occupancy  != null ? `<div style="display:flex;justify-content:space-between;margin-bottom:3px;"><span style="color:#64748b;">Ocupaci\xf3n</span><span>${t.occupancy}%</span></div>` : ''}
        ${t.tonsLoaded != null ? `<div style="display:flex;justify-content:space-between;margin-bottom:3px;"><span style="color:#64748b;">Toneladas</span><span>${t.tonsLoaded} t</span></div>` : ''}
        ${hasDelay ? `<div style="display:flex;justify-content:space-between;"><span style="color:#64748b;">Retraso</span><span style="color:#f59e0b;font-weight:bold;">+${t.delayMin} min</span></div>` : ''}
    </div>`;
}

// ── Main component ───────────────────────────────────────────────────────────────
export default function TrainMap({ trains }) {
    const containerRef = useRef(null);
    const mapRef       = useRef(null);
    const googleRef    = useRef(null);
    const markersRef   = useRef({});
    const polylinesRef = useRef([]);
    const infoWinRef   = useRef(null);

    const [mapReady,  setMapReady]  = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [routeList, setRouteList] = useState([]);

    // ── Load routes ────────────────────────────────────────────────────────────
    useEffect(() => {
        import('../services/api.js')
            .then(({ fetchRoutes }) => fetchRoutes())
            .then(setRouteList)
            .catch(() => {});
    }, []);

    // ── Initialize Google Map ──────────────────────────────────────────────────
    useEffect(() => {
        if (!API_KEY || !containerRef.current || mapRef.current) return;
        let cancelled = false;

        loadMapsAPI(API_KEY)
            .then((maps) => {
                if (cancelled || !containerRef.current) return;
                googleRef.current = maps;

                const map = new maps.Map(containerRef.current, {
                    center:            { lat: 12, lng: -78 },
                    zoom:              3,
                    styles:            MAP_STYLES,
                    disableDefaultUI:  false,
                    zoomControl:       true,
                    mapTypeControl:    false,
                    streetViewControl: false,
                    fullscreenControl: false,
                    scaleControl:      false,
                    gestureHandling:   'cooperative',
                    backgroundColor:   '#061220',
                });

                infoWinRef.current = new maps.InfoWindow({ pixelOffset: new maps.Size(0, -8) });
                map.addListener('click', () => infoWinRef.current?.close());

                mapRef.current = map;
                setMapReady(true);
            })
            .catch((err) => {
                console.error('[TrainMap] Maps JS failed:', err);
                if (!cancelled) setLoadError(true);
            });

        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Draw route polylines ───────────────────────────────────────────────────
    useEffect(() => {
        if (!mapReady || !googleRef.current || !routeList.length) return;
        const maps = googleRef.current;

        polylinesRef.current.forEach(p => p.setMap(null));
        polylinesRef.current = [];

        for (const route of routeList) {
            if (!route.stops?.length) continue;
            const color  = ROUTE_COLOR[route.type] || '#3b82f6';
            const isDash = route.type === 'carga';
            const line   = new maps.Polyline({
                path:          route.stops.map(s => ({ lat: s.lat, lng: s.lng })),
                geodesic:      true,
                strokeColor:   color,
                strokeOpacity: isDash ? 0 : 0.75,
                strokeWeight:  2.5,
                icons:         isDash ? [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.75, scale: 3 }, offset: '0', repeat: '12px' }] : [],
                map:           mapRef.current,
            });
            polylinesRef.current.push(line);
        }
    }, [mapReady, routeList]);

    // ── Update train markers on every snapshot refresh ─────────────────────────
    useEffect(() => {
        if (!mapReady || !googleRef.current) return;
        const maps       = googleRef.current;
        const currentIds = new Set(trains.map(t => t.id));

        for (const id of Object.keys(markersRef.current)) {
            if (!currentIds.has(id)) {
                markersRef.current[id].setMap(null);
                delete markersRef.current[id];
            }
        }

        for (const train of trains) {
            const pos   = { lat: train.lat, lng: train.lng };
            const color = STATUS_COLOR[train.status] || '#475569';
            const scale = train.status === 'EN_SERVICIO' ? 8 : 5.5;
            const icon  = { path: maps.SymbolPath.CIRCLE, fillColor: color, fillOpacity: 0.92, strokeColor: '#040d1a', strokeWeight: 1.5, scale };

            if (markersRef.current[train.id]) {
                const m = markersRef.current[train.id];
                m.setPosition(pos);
                m.setIcon(icon);
                m.__train = train;
            } else {
                const marker = new maps.Marker({
                    position:  pos,
                    map:       mapRef.current,
                    icon,
                    title:     `${train.id} — ${train.name}`,
                    zIndex:    train.status === 'EN_SERVICIO' ? 10 : 5,
                    optimized: true,
                });
                marker.__train = train;
                marker.addListener('click', () => {
                    infoWinRef.current.setContent(trainInfoHTML(marker.__train));
                    infoWinRef.current.open(mapRef.current, marker);
                });
                markersRef.current[train.id] = marker;
            }
        }
    }, [mapReady, trains]);

    if (!API_KEY || loadError) return <FallbackSVG trains={trains} />;

    return (
        <div className="w-full h-full occ-card rounded-xl overflow-hidden relative">
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
            {!mapReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center"
                    style={{ background: '#061220' }}>
                    <div className="w-5 h-5 border-2 border-t-[#1d6fa5] border-[#1d6fa5]/20 rounded-full animate-spin mb-2" />
                    <span className="text-[10px] font-mono" style={{ color: '#2a4a6b' }}>
                        Cargando mapa interactivo&hellip;
                    </span>
                </div>
            )}
            {mapReady && <Legend />}
        </div>
    );
}

// ── Legend overlay ───────────────────────────────────────────────────────────────
function Legend() {
    return (
        <div className="absolute bottom-2 left-2 flex gap-1.5 flex-wrap pointer-events-none">
            {[['#22c55e','dot','Servicio'],['#f59e0b','dot','Mant.'],['#475569','dot','Standby'],
              ['#3b82f6','line','Pasajeros'],['#f59e0b','line','Carga'],['#a855f7','line','Mixto']].map(([c,k,l]) => (
                <div key={l} className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(4,13,26,0.88)', border: '1px solid #0d2040' }}>
                    {k === 'dot'
                        ? <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c }} />
                        : <div className="w-4 h-0.5 flex-shrink-0" style={{ background: c }} />}
                    <span className="font-mono" style={{ color: '#64748b', fontSize: '9px' }}>{l}</span>
                </div>
            ))}
        </div>
    );
}

// ── SVG Fallback (no API key or load error) ──────────────────────────────────────
const TILE = 256, ZOOM = 3, IMG_W = 800, IMG_H = 500, SCALE = Math.pow(2, ZOOM);
const CTR  = { lat: 15, lng: -85 };
function toWorld(lat, lng) {
    const x   = (lng + 180) / 360 * TILE;
    const sin = Math.sin(lat * Math.PI / 180);
    const y   = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * TILE;
    return { x: x * SCALE, y: y * SCALE };
}
const CW = toWorld(CTR.lat, CTR.lng);
function proj(lat, lng) {
    const w = toWorld(lat, lng);
    return { x: +((w.x - CW.x) + IMG_W / 2).toFixed(2), y: +((w.y - CW.y) + IMG_H / 2).toFixed(2) };
}
function FallbackSVG({ trains }) {
    const dots = trains.map(t => ({ ...t, color: STATUS_COLOR[t.status] || '#475569', ...proj(t.lat, t.lng) }));
    return (
        <div className="w-full h-full occ-card rounded-xl overflow-hidden relative">
            <svg viewBox={`0 0 ${IMG_W} ${IMG_H}`} className="w-full h-full">
                <rect width={IMG_W} height={IMG_H} fill="#040d1a" />
                <defs>
                    <pattern id="fgrid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                        <path d="M60 0L0 0 0 60" fill="none" stroke="#0a1929" strokeWidth="0.4" />
                    </pattern>
                </defs>
                <rect width={IMG_W} height={IMG_H} fill="url(#fgrid)" opacity={0.6} />
                {dots.map(t => (
                    <circle key={t.id} cx={t.x} cy={t.y}
                        r={t.status === 'EN_SERVICIO' ? 5 : 3.5}
                        fill={t.color} stroke="#040d1a" strokeWidth={0.8}
                        opacity={t.status === 'EN_SERVICIO' ? 0.95 : 0.55} />
                ))}
                <text x={10} y={14} fontSize="7.5" fontFamily="monospace" fill="#1d6fa5" opacity={0.6}>
                    RED FERROVIARIA — Configura VITE_GOOGLE_MAPS_API_KEY para mapa interactivo
                </text>
            </svg>
            <Legend />
        </div>
    );
}

TrainMap.propTypes    = { trains: PropTypes.array };
TrainMap.defaultProps = { trains: [] };
FallbackSVG.propTypes = { trains: PropTypes.array };
