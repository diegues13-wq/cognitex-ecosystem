import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { ROUTES } from '../utils/dataGenerator.js';

// Geographic bounds of the Venezuelan rail network
const MIN_LNG = -71.65, MAX_LNG = -66.83;
const MIN_LAT = 10.05,  MAX_LAT = 10.65;

const W = 820, H = 200;
const PL = 18, PR = 18, PT = 22, PB = 28;
const UW = W - PL - PR;
const UH = H - PT - PB;

function proj(lat, lng) {
    return {
        x: PL + (lng - MIN_LNG) / (MAX_LNG - MIN_LNG) * UW,
        y: PT + (1 - (lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * UH,
    };
}

const ROUTE_STROKE = { pasajeros: '#3b82f6', carga: '#f59e0b', mixto: '#a855f7' };
const STATUS_COLOR = { EN_SERVICIO: '#22c55e', EN_MANTENIMIENTO: '#f59e0b', STANDBY: '#475569' };

export default function TrainMap({ trains }) {
    const paths = useMemo(() => ROUTES.map(r => {
        const pts = r.stops.map(s => proj(s.lat, s.lng));
        return {
            id: r.id,
            d: pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(''),
            stroke: ROUTE_STROKE[r.type] || '#3b82f6',
            dashed: r.type === 'carga',
        };
    }), []);

    const stations = useMemo(() => {
        const seen = new Set();
        return ROUTES.flatMap(r => r.stops).filter(s => {
            if (seen.has(s.id)) return false;
            seen.add(s.id);
            return true;
        }).map(s => ({ ...s, ...proj(s.lat, s.lng) }));
    }, []);

    const dots = useMemo(() => trains.map(t => ({
        id: t.id,
        callsign: t.callsign,
        status: t.status,
        color: STATUS_COLOR[t.status] || '#475569',
        active: t.status === 'EN_SERVICIO',
        ...proj(t.lat, t.lng),
    })), [trains]);

    return (
        <div className="w-full h-full occ-card rounded-xl overflow-hidden">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" role="img" aria-label="Red ferroviaria">
                <defs>
                    <pattern id="tgrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M40 0L0 0 0 40" fill="none" stroke="#0d2040" strokeWidth="0.5"/>
                    </pattern>
                </defs>
                <rect width={W} height={H} fill="url(#tgrid)" opacity="0.5"/>

                {/* Route lines */}
                {paths.map(r => (
                    <path
                        key={r.id}
                        d={r.d}
                        stroke={r.stroke}
                        strokeWidth={r.dashed ? 1.5 : 2}
                        strokeDasharray={r.dashed ? '5 3' : undefined}
                        fill="none"
                        opacity={0.55}
                    />
                ))}

                {/* Station dots */}
                {stations.map(s => (
                    <g key={s.id}>
                        <circle cx={s.x} cy={s.y} r={2.5} fill="#1d6fa5" stroke="#38a8e0" strokeWidth={0.8}/>
                        <text x={s.x} y={s.y - 5} textAnchor="middle" fontSize="6.5" fontFamily="monospace" fill="#334155">{s.name}</text>
                    </g>
                ))}

                {/* Train markers */}
                {dots.map(t => (
                    <g key={t.id}>
                        <circle cx={t.x} cy={t.y} r={t.active ? 5 : 4} fill={t.color} opacity={t.active ? 0.95 : 0.5}/>
                        {t.active && (
                            <text x={t.x + 7} y={t.y + 3} fontSize="6.5" fontFamily="monospace" fill="#94a3b8">{t.callsign}</text>
                        )}
                    </g>
                ))}

                {/* Header */}
                <text x={PL} y={13} fontSize="7.5" fontFamily="monospace" fill="#1d6fa5" letterSpacing="1.5" opacity="0.7">
                    RED FERROVIARIA · TIEMPO REAL · SIMULACIÓN
                </text>

                {/* Legend */}
                <g transform={`translate(${PL},${H - 14})`}>
                    {[['#22c55e','Servicio'],['#f59e0b','Mantenimiento'],['#475569','Standby']].map(([c,l],i) => (
                        <g key={l} transform={`translate(${i * 115},0)`}>
                            <circle cx="5" cy="5" r="3.5" fill={c}/>
                            <text x="12" y="9" fontSize="7" fontFamily="monospace" fill="#475569">{l}</text>
                        </g>
                    ))}
                    {[['#3b82f6','Pasajeros',false],['#f59e0b','Carga',true]].map(([c,l,d],i) => (
                        <g key={l} transform={`translate(${360 + i * 90},0)`}>
                            <line x1="0" y1="5" x2="12" y2="5" stroke={c} strokeWidth="2" strokeDasharray={d ? '4 2' : undefined}/>
                            <text x="16" y="9" fontSize="7" fontFamily="monospace" fill="#475569">{l}</text>
                        </g>
                    ))}
                </g>
            </svg>
        </div>
    );
}

TrainMap.propTypes = { trains: PropTypes.array };
TrainMap.defaultProps = { trains: [] };
