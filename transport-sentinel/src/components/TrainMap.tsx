import { useEffect, useRef, useState } from 'react';
import { STATUS_COLOR } from '@cognitex/theme';

import type { RailRoute, TrainSnapshot } from '../domain/types';
import { TRAIN_STATUS, TRAIN_STATUS_LABEL } from '../domain/status';
import {
    loadMaps,
    type MapsApi,
    type MapsInfoWindow,
    type MapsMap,
    type MapsMarker,
    type MapsPolyline,
} from '../services/maps';

/**
 * The network view.
 *
 * Two renderings of the same data: the Google SDK when a key was built in,
 * and a projected SVG when it was not. The fallback is not a placeholder —
 * an operator with no key still sees every train in the right place, which is
 * most of what this panel is for.
 */

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

/** Route colours are identity, and the shared theme carries one accent, so
 *  the map distinguishes service kinds by line style as well as hue. */
const ROUTE_STYLE: Record<RailRoute['type'], { color: string; dashed: boolean }> = {
    pasajeros: { color: 'var(--color-brand)', dashed: false },
    carga: { color: 'var(--color-warn)', dashed: true },
    mixto: { color: 'var(--color-info)', dashed: false },
};

const MAP_STYLES = [
    { elementType: 'geometry', stylers: [{ color: '#0a192f' }] },
    { elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050d1a' }] },
    { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#081426' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#112240' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    {
        featureType: 'administrative.country',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#1b3358' }, { weight: 1 }],
    },
];

/**
 * The info window, built as DOM rather than an HTML string.
 *
 * The previous version concatenated train fields into markup and hand-rolled
 * an HTML escaper to make that safe. Creating nodes and assigning
 * `textContent` cannot inject markup in the first place, so the escaper — and
 * the chance of someone adding one more interpolation without it — is gone.
 */
function infoWindowContent(train: TrainSnapshot): HTMLElement {
    const root = document.createElement('div');
    root.style.cssText =
        'font-family:var(--font-sans,sans-serif);min-width:190px;color:#0a192f;font-size:13px';

    const title = document.createElement('p');
    title.style.cssText = 'margin:0;font-weight:600';
    title.textContent = `${train.id} · ${train.callsign}`;
    root.append(title);

    const name = document.createElement('p');
    name.style.cssText = 'margin:2px 0 6px;color:#2d3748';
    name.textContent = `${train.name}${train.routeName ? ` — ${train.routeName}` : ''}`;
    root.append(name);

    const rows: [string, string][] = [
        ['Estado', TRAIN_STATUS_LABEL[train.status]],
        ['Velocidad', `${train.speed} km/h`],
    ];
    if (train.occupancy !== null) rows.push(['Ocupación', `${train.occupancy}%`]);
    if (train.tonsLoaded !== null) {
        rows.push(['Carga', `${train.tonsLoaded.toLocaleString('es-EC')} t`]);
    }
    if (train.delayMin > 0) rows.push(['Retraso', `+${train.delayMin} min`]);

    const list = document.createElement('dl');
    list.style.cssText = 'margin:0;display:grid;grid-template-columns:auto auto;gap:2px 12px';
    for (const [label, value] of rows) {
        const term = document.createElement('dt');
        term.style.cssText = 'color:#4a5568';
        term.textContent = label;
        const detail = document.createElement('dd');
        detail.style.cssText = 'margin:0;text-align:right;font-variant-numeric:tabular-nums';
        detail.textContent = value;
        list.append(term, detail);
    }
    root.append(list);

    return root;
}

export interface TrainMapProps {
    trains: TrainSnapshot[];
    routes: RailRoute[];
}

export function TrainMap({ trains, routes }: TrainMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapsMap | null>(null);
    const apiRef = useRef<MapsApi | null>(null);
    const markersRef = useRef(new Map<string, MapsMarker>());
    const polylinesRef = useRef<MapsPolyline[]>([]);
    const infoRef = useRef<MapsInfoWindow | null>(null);
    // Markers close over the train they were created with; this keeps the
    // popup showing the current position rather than the one from boot.
    const trainsRef = useRef(trains);
    useEffect(() => {
        trainsRef.current = trains;
    }, [trains]);

    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!API_KEY || !containerRef.current || mapRef.current) return;
        let cancelled = false;

        loadMaps(API_KEY)
            .then((maps) => {
                if (cancelled || !containerRef.current) return;
                apiRef.current = maps;

                const map = new maps.Map(containerRef.current, {
                    center: { lat: 12, lng: -78 },
                    zoom: 3,
                    styles: MAP_STYLES,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                    scaleControl: false,
                    gestureHandling: 'cooperative',
                    backgroundColor: '#050d1a',
                });

                infoRef.current = new maps.InfoWindow({ pixelOffset: new maps.Size(0, -8) });
                map.addListener('click', () => infoRef.current?.close());

                mapRef.current = map;
                setReady(true);
            })
            .catch((error: unknown) => {
                console.error('[TrainMap]', error);
                if (!cancelled) setFailed(true);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    // Route polylines.
    useEffect(() => {
        const maps = apiRef.current;
        const map = mapRef.current;
        if (!ready || !maps || !map) return;

        for (const line of polylinesRef.current) line.setMap(null);
        polylinesRef.current = routes
            .filter((route) => route.stops.length > 1)
            .map((route) => {
                const style = ROUTE_STYLE[route.type];
                return new maps.Polyline({
                    path: route.stops.map((stop) => ({ lat: stop.lat, lng: stop.lng })),
                    geodesic: true,
                    strokeColor: style.color,
                    // A dashed line is drawn as repeated icons over a transparent stroke.
                    strokeOpacity: style.dashed ? 0 : 0.7,
                    strokeWeight: 2.5,
                    icons: style.dashed
                        ? [
                              {
                                  icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.7, scale: 3 },
                                  offset: '0',
                                  repeat: '12px',
                              },
                          ]
                        : [],
                    map,
                });
            });
    }, [ready, routes]);

    // Train markers, updated in place on every refresh.
    useEffect(() => {
        const maps = apiRef.current;
        const map = mapRef.current;
        if (!ready || !maps || !map) return;

        const markers = markersRef.current;
        const live = new Set(trains.map((train) => train.id));

        for (const [id, marker] of markers) {
            if (!live.has(id)) {
                marker.setMap(null);
                markers.delete(id);
            }
        }

        for (const train of trains) {
            const position = { lat: train.lat, lng: train.lng };
            const icon = {
                path: maps.SymbolPath.CIRCLE,
                fillColor: STATUS_COLOR[TRAIN_STATUS[train.status]],
                fillOpacity: 0.92,
                strokeColor: '#050d1a',
                strokeWeight: 1.5,
                scale: train.status === 'EN_SERVICIO' ? 8 : 5.5,
            };

            const existing = markers.get(train.id);
            if (existing) {
                existing.setPosition(position);
                existing.setIcon(icon);
                continue;
            }

            const marker = new maps.Marker({
                position,
                map,
                icon,
                title: `${train.id} — ${train.name}`,
                zIndex: train.status === 'EN_SERVICIO' ? 10 : 5,
                optimized: true,
            });
            marker.addListener('click', () => {
                const current = trainsRef.current.find((item) => item.id === train.id) ?? train;
                infoRef.current?.setContent(infoWindowContent(current));
                infoRef.current?.open(map, marker);
            });
            markers.set(train.id, marker);
        }
    }, [ready, trains]);

    if (!API_KEY || failed) return <ProjectedMap trains={trains} />;

    return (
        <div className="occ-panel relative h-full overflow-hidden">
            <div ref={containerRef} className="h-full w-full" />
            {!ready && (
                <p
                    className="absolute inset-0 flex items-center justify-center bg-navy-900"
                    role="status"
                >
                    <span className="label-mono">Cargando mapa…</span>
                </p>
            )}
            <MapLegend />
        </div>
    );
}

// ── SVG fallback ────────────────────────────────────────────────────────────

const VIEW_W = 800;
const VIEW_H = 500;
const TILE = 256;
const ZOOM = 3;
const CENTER = { lat: 15, lng: -85 };

/** Web Mercator, the same projection the SDK uses, so the two agree. */
function toWorld(lat: number, lng: number): { x: number; y: number } {
    const scale = 2 ** ZOOM;
    const x = ((lng + 180) / 360) * TILE;
    const sin = Math.sin((lat * Math.PI) / 180);
    const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * TILE;
    return { x: x * scale, y: y * scale };
}

const ORIGIN = toWorld(CENTER.lat, CENTER.lng);

function project(lat: number, lng: number): { x: number; y: number } {
    const world = toWorld(lat, lng);
    return { x: world.x - ORIGIN.x + VIEW_W / 2, y: world.y - ORIGIN.y + VIEW_H / 2 };
}

function ProjectedMap({ trains }: { trains: TrainSnapshot[] }) {
    const active = trains.filter((train) => train.status === 'EN_SERVICIO').length;

    return (
        <div className="occ-panel relative h-full overflow-hidden">
            <svg
                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                className="h-full w-full"
                role="img"
                aria-label={`Posición de ${trains.length} trenes en la red de las Américas, ${active} en servicio.`}
            >
                <defs>
                    <pattern id="occ-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                        <path
                            d="M60 0L0 0 0 60"
                            fill="none"
                            stroke="var(--color-navy-700)"
                            strokeWidth="0.5"
                        />
                    </pattern>
                </defs>
                <rect width={VIEW_W} height={VIEW_H} fill="var(--color-navy-900)" />
                <rect width={VIEW_W} height={VIEW_H} fill="url(#occ-grid)" />

                {trains.map((train) => {
                    const { x, y } = project(train.lat, train.lng);
                    const running = train.status === 'EN_SERVICIO';
                    return (
                        <circle
                            key={train.id}
                            cx={x}
                            cy={y}
                            r={running ? 5 : 3.5}
                            fill={STATUS_COLOR[TRAIN_STATUS[train.status]]}
                            stroke="var(--color-navy-900)"
                            strokeWidth={1}
                            opacity={running ? 0.95 : 0.6}
                        >
                            <title>{`${train.id} — ${train.name} · ${TRAIN_STATUS_LABEL[train.status]}`}</title>
                        </circle>
                    );
                })}
            </svg>
            <p className="absolute top-2 right-2 left-2 text-xs text-steel">
                Vista proyectada · configure VITE_GOOGLE_MAPS_API_KEY para el mapa interactivo
            </p>
            <MapLegend />
        </div>
    );
}

function MapLegend() {
    return (
        <ul className="absolute bottom-2 left-2 m-0 flex list-none flex-wrap gap-1.5 p-0">
            {(['EN_SERVICIO', 'EN_MANTENIMIENTO', 'STANDBY'] as const).map((status) => (
                <li
                    key={status}
                    className="flex items-center gap-1.5 rounded border border-steel/20 bg-navy-900/90 px-1.5 py-0.5 text-xs text-steel"
                >
                    <span
                        className="occ-dot"
                        style={{ backgroundColor: STATUS_COLOR[TRAIN_STATUS[status]] }}
                        aria-hidden="true"
                    />
                    {TRAIN_STATUS_LABEL[status]}
                </li>
            ))}
        </ul>
    );
}
