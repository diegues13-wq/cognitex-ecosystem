import { useMemo } from 'react';

import type { Schedule } from '../domain/types';
import { ON_TIME_LIMIT_MIN } from '../domain/status';
import { ChartEmpty } from './Charts';

/**
 * The train graph — time along x, distance along y, one line per service.
 *
 * The axis window now comes from the route's own `operatingHours` instead of
 * a hardcoded 05:00–23:00. Half the network does not run those hours: The
 * Canadian departs in a two-hour window, Carajás runs around the clock, and
 * every one of their services was being drawn compressed into, or clipped out
 * of, somebody else's timetable.
 */

const WIDTH = 820;
const HEIGHT = 260;
const MARGIN = { top: 16, right: 16, bottom: 28, left: 108 };
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;

function parseClock(value: string): number {
    const [hours = '0', minutes = '0'] = value.split(':');
    return Number(hours) * 60 + Number(minutes);
}

function formatClock(totalMin: number): string {
    const hours = Math.floor(totalMin / 60) % 24;
    return `${String(hours).padStart(2, '0')}h`;
}

export interface TrainGraphProps {
    schedule: Schedule | null;
    /** The instant to draw the AHORA line at, passed in rather than read from
     *  the clock during render so it moves with the data refresh. */
    now: number;
}

export function TrainGraph({ schedule, now }: TrainGraphProps) {
    const geometry = useMemo(() => {
        if (!schedule || schedule.route.stops.length < 2) return null;

        const { route, services } = schedule;
        const startMin = parseClock(route.operatingHours.start);
        const endMin = Math.max(parseClock(route.operatingHours.end), startMin + 60);
        const span = endMin - startMin;
        const maxKm = Math.max(route.distanceKm, 1);

        const toX = (totalMin: number) =>
            MARGIN.left + ((totalMin - startMin) / span) * PLOT_W;
        const toY = (km: number) => MARGIN.top + (1 - km / maxKm) * PLOT_H;

        // One tick per hour, thinned so the labels never collide.
        const hourStep = Math.max(1, Math.ceil(span / 60 / 12));
        const ticks: number[] = [];
        for (
            let minute = Math.ceil(startMin / 60) * 60;
            minute <= endMin;
            minute += hourStep * 60
        ) {
            ticks.push(minute);
        }

        return { route, services, startMin, endMin, toX, toY, ticks };
    }, [schedule]);

    if (!geometry) return <ChartEmpty height={HEIGHT} />;

    const { route, services, startMin, endMin, toX, toY, ticks } = geometry;

    const clockNow = new Date(now);
    const nowMinutes = clockNow.getHours() * 60 + clockNow.getMinutes();
    const nowMin = nowMinutes >= startMin && nowMinutes <= endMin ? nowMinutes : null;

    const late = services.filter((service) => service.delayMin > ON_TIME_LIMIT_MIN).length;

    return (
        <figure className="m-0 overflow-x-auto">
            <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className="w-full"
                style={{ minWidth: 520 }}
                role="img"
                aria-label={`Gráfico tiempo-distancia de ${route.name}: ${services.length} servicios entre ${route.operatingHours.start} y ${route.operatingHours.end}, ${late} con retraso.`}
            >
                {ticks.map((minute) => (
                    <g key={minute}>
                        <line
                            x1={toX(minute)}
                            y1={MARGIN.top}
                            x2={toX(minute)}
                            y2={MARGIN.top + PLOT_H}
                            stroke="var(--color-steel)"
                            strokeOpacity={0.12}
                        />
                        <text
                            x={toX(minute)}
                            y={HEIGHT - 10}
                            textAnchor="middle"
                            fontSize={10}
                            fontFamily="var(--font-mono)"
                            fill="var(--color-steel)"
                        >
                            {formatClock(minute)}
                        </text>
                    </g>
                ))}

                {route.stops.map((stop) => (
                    <g key={stop.id}>
                        <line
                            x1={MARGIN.left}
                            y1={toY(stop.km)}
                            x2={MARGIN.left + PLOT_W}
                            y2={toY(stop.km)}
                            stroke="var(--color-steel)"
                            strokeOpacity={0.12}
                        />
                        <text
                            x={MARGIN.left - 8}
                            y={toY(stop.km) + 3}
                            textAnchor="end"
                            fontSize={10}
                            fontFamily="var(--font-mono)"
                            fill="var(--color-steel)"
                        >
                            {stop.name.length > 14 ? `${stop.name.slice(0, 13)}…` : stop.name}
                        </text>
                    </g>
                ))}

                {services.map((service) => {
                    const first = service.stops[0];
                    const last = service.stops.at(-1);
                    if (!first || !last) return null;

                    const delayed = service.delayMin > ON_TIME_LIMIT_MIN;
                    const stroke = delayed ? 'var(--color-warn)' : 'var(--color-brand)';

                    return (
                        <g key={service.id}>
                            {/* Planned path, behind the actual one. */}
                            {delayed && (
                                <line
                                    x1={toX(service.departureMin - service.delayMin)}
                                    y1={toY(first.km)}
                                    x2={toX(service.arrivalMin - service.delayMin)}
                                    y2={toY(last.km)}
                                    stroke="var(--color-steel)"
                                    strokeOpacity={0.4}
                                    strokeDasharray="4 4"
                                />
                            )}
                            <line
                                x1={toX(first.actualMin)}
                                y1={toY(first.km)}
                                x2={toX(last.actualMin)}
                                y2={toY(last.km)}
                                stroke={stroke}
                                strokeWidth={2}
                                strokeLinecap="round"
                            >
                                <title>
                                    {`${service.trainId} · ${service.id} — ${
                                        delayed ? `+${service.delayMin} min` : 'en horario'
                                    }`}
                                </title>
                            </line>
                            {service.stops.slice(1, -1).map((stop) => (
                                <circle
                                    key={stop.id}
                                    cx={toX(stop.actualMin)}
                                    cy={toY(stop.km)}
                                    r={2}
                                    fill={stroke}
                                    opacity={0.7}
                                />
                            ))}
                        </g>
                    );
                })}

                {nowMin !== null && (
                    <g>
                        <line
                            x1={toX(nowMin)}
                            y1={MARGIN.top}
                            x2={toX(nowMin)}
                            y2={MARGIN.top + PLOT_H}
                            stroke="var(--color-alert)"
                            strokeWidth={1}
                            strokeDasharray="4 3"
                        />
                        <text
                            x={toX(nowMin) + 4}
                            y={MARGIN.top + 10}
                            fontSize={10}
                            fontFamily="var(--font-mono)"
                            fill="var(--color-alert)"
                        >
                            AHORA
                        </text>
                    </g>
                )}
            </svg>

            <figcaption className="mt-2 flex flex-wrap justify-between gap-x-4 text-xs text-steel">
                <span>{route.name}</span>
                <span>
                    {services.length} servicios · {late} con retraso mayor a{' '}
                    {ON_TIME_LIMIT_MIN} min
                </span>
            </figcaption>
        </figure>
    );
}
