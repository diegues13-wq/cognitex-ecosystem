/**
 * Server-rendered fallback for the live-demo widgets.
 *
 * Mirrors `services/demo-api/src/simulate.js` so the first paint matches the
 * shape the API will return. This is ONLY ever shown labelled as simulated —
 * see the provenance badge in LiveDemo.astro. It exists so the widget is not
 * an empty box before the fetch resolves, and so it still says something
 * useful with JavaScript disabled.
 *
 * Delete this once both devices report reliably.
 */

import type { Point } from './demo-chart';

export function simulateOfficeSeries(hours = 24, now = Date.now()): Point[] {
    const points: Point[] = [];
    const stepMs = (hours * 60 * 60 * 1000) / (hours * 2);

    for (let i = hours * 2; i >= 0; i--) {
        const at = now - i * stepMs;
        const date = new Date(at);
        const hourOfDay = date.getHours() + date.getMinutes() / 60;

        const base = 2.6;
        const workday = Math.exp(-Math.pow(hourOfDay - 11.5, 2) / 18) * 4.2;
        const jitter = Math.sin(at / 900000) * 0.18;

        points.push({ at, kw: Number((base + workday + jitter).toFixed(2)) });
    }

    return points;
}

export function simulateVehicleDay(now = Date.now()) {
    const hourOfDay = new Date(now).getHours();
    const progress = Math.min(Math.max((hourOfDay - 7) / 11, 0), 1);

    return {
        kmToday: Number((46 * progress).toFixed(0)),
        litersPer100km: 9.4,
        stops: Math.round(7 * progress),
    };
}
