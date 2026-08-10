/**
 * Fallback data for when no device has reported recently.
 *
 * This exists so the site degrades gracefully, NOT so it can claim numbers it
 * does not have. Anything produced here is returned with `source: "simulated"`
 * and the landing renders it with a "simulated" label instead of the live dot.
 *
 * Delete this module the day both devices report reliably.
 */

/** A plausible office load curve: low overnight, peak late morning. */
export function simulateOfficeSeries(hours = 24, now = Date.now()) {
    const points = [];
    const stepMs = (hours * 60 * 60 * 1000) / (hours * 2); // one point per 30 min

    for (let i = hours * 2; i >= 0; i--) {
        const at = now - i * stepMs;
        const hourOfDay = new Date(at).getHours() + new Date(at).getMinutes() / 60;

        // Base load (servers, fridge) plus a working-hours bell curve.
        const base = 2.6;
        const workday = Math.exp(-Math.pow(hourOfDay - 11.5, 2) / 18) * 4.2;
        const jitter = Math.sin(at / 900000) * 0.18;

        points.push({ at, kw: Number((base + workday + jitter).toFixed(2)) });
    }

    return points;
}

export function simulateVehicleDay(now = Date.now()) {
    const hourOfDay = new Date(now).getHours();
    // Distance accumulates through the day rather than appearing at midnight.
    const progress = Math.min(Math.max((hourOfDay - 7) / 11, 0), 1);

    return {
        kmToday: Number((46 * progress).toFixed(0)),
        litersPer100km: 9.4,
        stops: Math.round(7 * progress),
        at: now,
    };
}
