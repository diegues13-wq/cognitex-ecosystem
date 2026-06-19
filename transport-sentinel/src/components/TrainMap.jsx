import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ROUTES } from '../utils/dataGenerator.js';

// ── Map parameters ─────────────────────────────────────────────────────────────
const CENTER  = { lat: 15, lng: -85 };
const ZOOM    = 3;
const IMG_W   = 800;
const IMG_H   = 500;

// ── Mercator pixel projection (matches Google Maps tile system exactly) ─────────
const TILE  = 256;
const SCALE = Math.pow(2, ZOOM);

function toWorld(lat, lng) {
    const x   = (lng + 180) / 360 * TILE;
    const sin = Math.sin(lat * Math.PI / 180);
    const y   = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * TILE;
    return { x: x * SCALE, y: y * SCALE };
}
const CW = toWorld(CENTER.lat, CENTER.lng);

function project(lat, lng) {
    const w = toWorld(lat, lng);
    return {
        x: parseFloat(((w.x - CW.x) + IMG_W / 2).toFixed(2)),
        y: parseFloat(((w.y - CW.y) + IMG_H / 2).toFixed(2)),
    };
}

// ── Static Maps URL (Google Maps API — no WebGL, no WASM, pure PNG image) ───────
const DARK_STYLES = [
    'feature:all|element:geometry|color:0x0a1929',
    'feature:all|element:labels|visibility:off',
    'feature:water|element:geometry|color:0x010b18',
    'feature:landscape|element:geometry|color:0x061220',
    'feature:road|element:geometry|color:0x0d2040',
    'feature:road.highway|element:geometry|color:0x162a45',
    'feature:administrative.country|element:geometry.stroke|color:0x1d3a5c|weight:1',
    'feature:administrative.province|element:geometry.stroke|color:0x0d2040|weight:0.5',
].map(s => `&style=${encodeURIComponent(s)}`).join('');

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const MAP_IMG_SRC = API_KEY
    ? `https://maps.googleapis.com/maps/api/staticmap` +
      `?center=${CENTER.lat},${CENTER.lng}&zoom=${ZOOM}&size=${IMG_W}x${IMG_H}` +
      DARK_STYLES +
      `&key=${API_KEY}`
    : null;

// ── Visual config ───────────────────────────────────────────────────────────────
const ROUTE_COLOR  = { pasajeros: '#3b82f6', carga: '#f59e0b', mixto: '#a855f7' };
const STATUS_COLOR = { EN_SERVICIO: '#22c55e', EN_MANTENIMIENTO: '#f59e0b', STANDBY: '#475569' };
const STATUS_LABEL = { EN_SERVICIO: 'En Servicio', EN_MANTENIMIENTO: 'Mantenimiento', STANDBY: 'Standby' };

export default function TrainMap({ trains }) {
    const [selected, setSelected] = useState(null);
    const [imgError, setImgError] = useState(false);

    const paths = useMemo(() => ROUTES.map(r => {
        const pts = r.stops.map(s => project(s.lat, s.lng));
        return {
            id:     r.id,
            d:      pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' '),
            color:  ROUTE_COLOR[r.type] || '#3b82f6',
            dashed: r.type === 'carga',
        };
    }), []);

    const dots = useMemo(() => trains.map(t => ({
        ...t,
        color:  STATUS_COLOR[t.status] || '#475569',
        active: t.status === 'EN_SERVICIO',
        ...project(t.lat, t.lng),
    })), [trains]);

    const infoPos = useMemo(() => {
        if (!selected) return null;
        const p = project(selected.lat, selected.lng);
        return { x: Math.min(p.x + 10, IMG_W - 178), y: Math.max(p.y - 110, 8) };
    }, [selected]);

    if (!API_KEY || imgError) return (
        <FallbackSVG paths={paths} dots={dots} selected={selected} setSelected={setSelected} />
    );

    return (
        <div
            className="w-full h-full occ-card rounded-xl overflow-hidden relative"
            onClick={() => setSelected(null)}
        >
            {/* Google Maps Static API — PNG image, zero WebGL/WASM, zero SIGTRAP */}
            <img
                src={MAP_IMG_SRC}
                alt="Red ferroviaria Américas — Google Maps"
                className="absolute inset-0 w-full h-full object-fill"
                draggable={false}
                onError={() => setImgError(true)}
            />

            {/* SVG overlay — routes + train markers */}
            <svg
                viewBox={`0 0 ${IMG_W} ${IMG_H}`}
                className="absolute inset-0 w-full h-full"
                style={{ pointerEvents: 'none' }}
            >
                {paths.map(r => (
                    <path
                        key={r.id}
                        d={r.d}
                        stroke={r.color}
                        strokeWidth={r.dashed ? 1.5 : 2.5}
                        strokeDasharray={r.dashed ? '6 3' : undefined}
                        fill="none"
                        opacity={0.78}
                    />
                ))}

                {dots.map(t => (
                    <g
                        key={t.id}
                        style={{ pointerEvents: 'all', cursor: 'pointer' }}
                        onClick={e => { e.stopPropagation(); setSelected(prev => prev?.id === t.id ? null : t); }}
                    >
                        {t.active && <circle cx={t.x} cy={t.y} r={8} fill="none" stroke={t.color} strokeWidth={0.8} opacity={0.3}/>}
                        <circle cx={t.x} cy={t.y} r={t.active ? 5.5 : 4} fill={t.color} stroke="#040d1a" strokeWidth={1} opacity={t.active ? 0.95 : 0.6}/>
                    </g>
                ))}

                {selected && infoPos && <InfoBox train={selected} pos={infoPos} onClose={() => setSelected(null)} />}
            </svg>

            <Legend />
        </div>
    );
}

// ── Info box component (pure SVG) ───────────────────────────────────────────────
function InfoBox({ train, pos, onClose }) {
    const { x, y } = pos;
    const bw = 172;
    const hasLoad  = train.occupancy != null || train.tonsLoaded != null;
    const hasDelay = (train.delayMin ?? 0) > 3;
    const bh = 46 + (hasLoad ? 11 : 0) + (hasDelay ? 11 : 0) + 22;
    let row = 0;
    const nextY = () => { row++; return y + 48 + (row - 1) * 11; };

    return (
        <g style={{ pointerEvents: 'all' }}>
            <rect x={x} y={y} width={bw} height={bh} rx={6} fill="#081526" stroke="#1d6fa5" strokeWidth={0.8} opacity={0.97}/>
            <text x={x+8}     y={y+13} fontSize="8.5" fontFamily="monospace" fill="#38a8e0" fontWeight="bold">{train.id} · {train.callsign}</text>
            <text x={x+8}     y={y+24} fontSize="7.5" fontFamily="monospace" fill="#cbd5e1">{train.name}</text>
            <text x={x+8}     y={y+34} fontSize="7"   fontFamily="monospace" fill="#475569">{train.routeName}</text>
            <line x1={x+6} y1={y+39} x2={x+bw-6} y2={y+39} stroke="#0d2040" strokeWidth={0.6}/>

            <text x={x+8}  y={nextY()} fontSize="7.5" fontFamily="monospace" fill="#475569">Estado</text>
            <text x={x+70} y={y + 48 + (row-1)*11} fontSize="7.5" fontFamily="monospace" fill={STATUS_COLOR[train.status]} fontWeight="bold">{STATUS_LABEL[train.status]}</text>

            <text x={x+8}  y={nextY()} fontSize="7.5" fontFamily="monospace" fill="#475569">Velocidad</text>
            <text x={x+70} y={y + 48 + (row-1)*11} fontSize="7.5" fontFamily="monospace" fill="#e2e8f0">{train.speed ?? 0} km/h</text>

            {train.occupancy != null && <>
                <text x={x+8}  y={nextY()} fontSize="7.5" fontFamily="monospace" fill="#475569">Ocupación</text>
                <text x={x+70} y={y + 48 + (row-1)*11} fontSize="7.5" fontFamily="monospace" fill="#e2e8f0">{train.occupancy}%</text>
            </>}
            {train.tonsLoaded != null && <>
                <text x={x+8}  y={nextY()} fontSize="7.5" fontFamily="monospace" fill="#475569">Toneladas</text>
                <text x={x+70} y={y + 48 + (row-1)*11} fontSize="7.5" fontFamily="monospace" fill="#e2e8f0">{train.tonsLoaded} t</text>
            </>}
            {hasDelay && <>
                <text x={x+8}  y={nextY()} fontSize="7.5" fontFamily="monospace" fill="#475569">Retraso</text>
                <text x={x+70} y={y + 48 + (row-1)*11} fontSize="7.5" fontFamily="monospace" fill="#f59e0b" fontWeight="bold">+{train.delayMin} min</text>
            </>}

            <text x={x+bw-12} y={y+12} fontSize="9" fontFamily="monospace" fill="#475569"
                style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); onClose(); }}>✕</text>
        </g>
    );
}

// ── Legend overlay ──────────────────────────────────────────────────────────────
function Legend() {
    return (
        <div className="absolute bottom-1.5 left-2 flex gap-1.5 flex-wrap pointer-events-none">
            {[['#22c55e','dot','Servicio'],['#f59e0b','dot','Mantenimiento'],['#475569','dot','Standby'],
              ['#3b82f6','line','Pasajeros'],['#f59e0b','line','Carga'],['#a855f7','line','Mixto']].map(([c,k,l]) => (
                <div key={l} className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                    style={{ background:'rgba(4,13,26,0.85)', border:'1px solid #0d2040' }}>
                    {k === 'dot'
                        ? <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:c }}/>
                        : <div className="w-3 h-0.5 flex-shrink-0" style={{ background:c }}/>}
                    <span className="font-mono" style={{ color:'#64748b', fontSize:'9px' }}>{l}</span>
                </div>
            ))}
        </div>
    );
}

// ── Fallback: pure SVG map when no API key or image error ───────────────────────
function FallbackSVG({ paths, dots, selected, setSelected }) {
    return (
        <div className="w-full h-full occ-card rounded-xl overflow-hidden">
            <svg viewBox={`0 0 ${IMG_W} ${IMG_H}`} className="w-full h-full">
                <rect width={IMG_W} height={IMG_H} fill="#040d1a"/>
                <defs>
                    <pattern id="fg" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                        <path d="M60 0L0 0 0 60" fill="none" stroke="#0a1929" strokeWidth="0.4"/>
                    </pattern>
                </defs>
                <rect width={IMG_W} height={IMG_H} fill="url(#fg)" opacity={0.6}/>
                {paths.map(r => (
                    <path key={r.id} d={r.d} stroke={r.color} strokeWidth={r.dashed ? 1.5 : 2}
                        strokeDasharray={r.dashed ? '6 3' : undefined} fill="none" opacity={0.65}/>
                ))}
                {dots.map(t => (
                    <g key={t.id} style={{ cursor:'pointer' }}
                        onClick={e => { e.stopPropagation(); setSelected(prev => prev?.id === t.id ? null : t); }}>
                        <circle cx={t.x} cy={t.y} r={t.active ? 5 : 3.5} fill={t.color} stroke="#040d1a" strokeWidth={0.8} opacity={t.active ? 0.95 : 0.55}/>
                    </g>
                ))}
                <text x={10} y={12} fontSize="7" fontFamily="monospace" fill="#1d6fa5" opacity={0.65}>
                    RED FERROVIARIA AMÉRICAS
                </text>
            </svg>
        </div>
    );
}

TrainMap.propTypes    = { trains: PropTypes.array };
TrainMap.defaultProps = { trains: [] };
InfoBox.propTypes     = { train: PropTypes.object, pos: PropTypes.object, onClose: PropTypes.func };
FallbackSVG.propTypes = { paths: PropTypes.array, dots: PropTypes.array, selected: PropTypes.object, setSelected: PropTypes.func };
