import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { ROUTES } from '../utils/dataGenerator.js';

const WIDTH = 820;
const HEIGHT = 260;
const MARGIN = { top: 20, right: 20, bottom: 30, left: 110 };
const CHART_W = WIDTH - MARGIN.left - MARGIN.right;
const CHART_H = HEIGHT - MARGIN.top - MARGIN.bottom;

const START_HOUR = 5;
const END_HOUR = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR;

const TRAIN_COLORS = {
    EN_SERVICIO:      '#38a8e0',
    EN_MANTENIMIENTO: '#f59e0b',
    STANDBY:          '#475569',
};

function timeToX(totalMin) {
    const offsetMin = totalMin - START_HOUR * 60;
    return MARGIN.left + (offsetMin / (TOTAL_HOURS * 60)) * CHART_W;
}

function kmToY(km, maxKm) {
    return MARGIN.top + (1 - km / maxKm) * CHART_H;
}

export default function TrainGraph({ routeId = 'RT-001', schedule = null, trains = [] }) {
    const [tooltip, setTooltip] = useState(null);
    const svgRef = useRef(null);

    const route = ROUTES.find(r => r.id === routeId) || ROUTES[0];
    const maxKm = route.distanceKm;

    const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);
    const services = schedule?.services || [];

    function handleMouseMove(e, service) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        setTooltip({
            x: e.clientX - rect.left + 12,
            y: e.clientY - rect.top - 8,
            service,
        });
    }

    function handleMouseLeave() {
        setTooltip(null);
    }

    return (
        <div className="relative w-full overflow-x-auto">
            <div className="flex items-center justify-between px-3 pb-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-rail-glow font-bold tracking-widest uppercase">Gráfico Tren</span>
                    <span className="text-[10px] font-mono text-slate-500">{route.name}</span>
                </div>
                <div className="flex items-center gap-3 text-[9px] font-mono">
                    <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-rail-glow" /> Programado</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-amber-400 border-dashed border-b border-amber-400" /> Con retraso</span>
                    <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-full bg-green-400" /> Posición actual</span>
                </div>
            </div>

            <svg
                ref={svgRef}
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className="w-full"
                style={{ minWidth: 500, background: 'transparent' }}
            >
                {/* Grid vertical lines (hours) */}
                {hours.map(h => {
                    const x = timeToX(h * 60);
                    return (
                        <g key={h}>
                            <line x1={x} y1={MARGIN.top} x2={x} y2={MARGIN.top + CHART_H}
                                stroke="#0d2040" strokeWidth={1} />
                            <text x={x} y={HEIGHT - 8} textAnchor="middle"
                                fill="#475569" fontSize={9} fontFamily="monospace">
                                {String(h).padStart(2, '0')}h
                            </text>
                        </g>
                    );
                })}

                {/* Grid horizontal lines (stations) */}
                {route.stops.map((stop, i) => {
                    const y = kmToY(stop.km, maxKm);
                    return (
                        <g key={stop.id}>
                            <line x1={MARGIN.left} y1={y} x2={MARGIN.left + CHART_W} y2={y}
                                stroke="#0d2040" strokeWidth={1} strokeDasharray={i === 0 || i === route.stops.length - 1 ? 'none' : '3 4'} />
                            <text x={MARGIN.left - 6} y={y + 3} textAnchor="end"
                                fill="#475569" fontSize={9} fontFamily="monospace">
                                {stop.name.length > 13 ? stop.name.slice(0, 12) + '…' : stop.name}
                            </text>
                            <text x={MARGIN.left - 6} y={y + 12} textAnchor="end"
                                fill="#0d2040" fontSize={8} fontFamily="monospace">
                                {stop.km}km
                            </text>
                        </g>
                    );
                })}

                {/* Border box */}
                <rect x={MARGIN.left} y={MARGIN.top} width={CHART_W} height={CHART_H}
                    fill="none" stroke="#0d2040" strokeWidth={1} />

                {/* Train service lines */}
                {services.map(service => {
                    const dep = service.stops?.[0];
                    const arr = service.stops?.[service.stops.length - 1];
                    if (!dep || !arr) return null;

                    const x1 = timeToX(dep.actualMin);
                    const y1 = kmToY(dep.km, maxKm);
                    const x2 = timeToX(arr.actualMin);
                    const y2 = kmToY(arr.km, maxKm);

                    const isDelayed = service.delayMin > 3;
                    const color = isDelayed ? '#f59e0b' : '#1d6fa5';
                    const currentX = timeToX(service.departureMin + (service.arrivalMin - service.departureMin) / 2);
                    const currentY = (y1 + y2) / 2;

                    return (
                        <g key={service.id}>
                            {/* Planned line (dashed if delayed) */}
                            <line
                                x1={timeToX(service.departureMin - service.delayMin)}
                                y1={y1}
                                x2={timeToX(service.arrivalMin - service.delayMin)}
                                y2={y2}
                                stroke="#1d4a6e"
                                strokeWidth={1}
                                strokeDasharray="3 3"
                                opacity={0.4}
                            />
                            {/* Actual line */}
                            <line
                                x1={x1} y1={y1} x2={x2} y2={y2}
                                stroke={color}
                                strokeWidth={1.8}
                                opacity={0.85}
                                style={{ cursor: 'pointer' }}
                                onMouseMove={e => handleMouseMove(e, service)}
                                onMouseLeave={handleMouseLeave}
                            />
                            {/* Service ID label */}
                            <text
                                x={(x1 + x2) / 2 - 4}
                                y={(y1 + y2) / 2 - 4}
                                fill={color}
                                fontSize={7}
                                fontFamily="monospace"
                                opacity={0.8}
                            >
                                {service.trainId}
                            </text>
                            {/* Current position dot */}
                            <circle
                                cx={currentX}
                                cy={currentY}
                                r={4}
                                fill={service.onTime ? '#22c55e' : '#ef4444'}
                                stroke={service.onTime ? '#4ade80' : '#fca5a5'}
                                strokeWidth={1.5}
                                style={{ cursor: 'pointer' }}
                                onMouseMove={e => handleMouseMove(e, service)}
                                onMouseLeave={handleMouseLeave}
                            />
                            {/* Arrival stop markers */}
                            {service.stops?.slice(1, -1).map((stop, si) => (
                                <circle
                                    key={si}
                                    cx={timeToX(stop.actualMin)}
                                    cy={kmToY(stop.km, maxKm)}
                                    r={2}
                                    fill={color}
                                    opacity={0.6}
                                />
                            ))}
                        </g>
                    );
                })}

                {/* "Now" vertical line */}
                {(() => {
                    const now = new Date();
                    const nowMin = now.getHours() * 60 + now.getMinutes();
                    if (nowMin < START_HOUR * 60 || nowMin > END_HOUR * 60) return null;
                    const xNow = timeToX(nowMin);
                    return (
                        <g>
                            <line x1={xNow} y1={MARGIN.top} x2={xNow} y2={MARGIN.top + CHART_H}
                                stroke="#ef4444" strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />
                            <text x={xNow + 3} y={MARGIN.top + 10} fill="#ef4444" fontSize={8} fontFamily="monospace">
                                AHORA
                            </text>
                        </g>
                    );
                })()}
            </svg>

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="absolute z-50 bg-occ-800/95 border border-occ-700/60 rounded-lg p-2.5 shadow-xl pointer-events-none text-[10px] font-mono min-w-[160px]"
                    style={{ left: tooltip.x, top: tooltip.y }}
                >
                    <p className="font-bold text-rail-glow mb-1">{tooltip.service.trainId} · {tooltip.service.id}</p>
                    <p className="text-slate-400">Dirección: {tooltip.service.direction}</p>
                    <p className={tooltip.service.onTime ? 'text-green-400' : 'text-amber-400'}>
                        {tooltip.service.onTime ? '✓ EN HORARIO' : `⚠ +${tooltip.service.delayMin} min retraso`}
                    </p>
                </div>
            )}
        </div>
    );
}

TrainGraph.propTypes = {
    routeId:  PropTypes.string,
    schedule: PropTypes.object,
    trains:   PropTypes.array,
};
