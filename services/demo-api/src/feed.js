/**
 * Assembles the public demo payload.
 *
 * The store functions are injected rather than imported so this can be tested
 * without Firestore, and so the freshness rule — the one piece of logic that
 * decides whether the site tells the truth about its own data — is verified
 * directly.
 */

import { simulateOfficeSeries, simulateVehicleDay } from './simulate.js';

/** A reading older than this means the device stopped reporting. */
export const FRESHNESS_WINDOW_MS = 60 * 60 * 1000;

export const dayKey = (date = new Date()) => date.toISOString().slice(0, 10);

/**
 * @param {object} deps
 * @param {boolean} deps.storeAvailable
 * @param {() => Promise<{at:number,kw:number}[]>} deps.readOfficeSeries
 * @param {() => Promise<{kmToday:number,litersPer100km:number,stops:number,at:number}|null>} deps.readVehicleDay
 * @param {number} [deps.now]
 */
export async function buildPayload({
    storeAvailable,
    readOfficeSeries,
    readVehicleDay,
    now = Date.now(),
}) {
    let officeSeries = [];
    let vehicle = null;

    if (storeAvailable) {
        try {
            [officeSeries, vehicle] = await Promise.all([readOfficeSeries(), readVehicleDay()]);
        } catch (err) {
            // A read failure must not take the page down; it falls back to
            // simulation, which is then labelled as such.
            console.error('[feed] read failed, falling back to simulation:', err.message);
            officeSeries = [];
            vehicle = null;
        }
    }

    const officeFresh =
        Array.isArray(officeSeries) &&
        officeSeries.length > 0 &&
        now - officeSeries.at(-1).at < FRESHNESS_WINDOW_MS;

    const vehicleFresh =
        vehicle !== null && Number.isFinite(vehicle?.at) && now - vehicle.at < FRESHNESS_WINDOW_MS;

    const office = officeFresh ? officeSeries : simulateOfficeSeries(24, now);
    const car = vehicleFresh ? vehicle : simulateVehicleDay(now);

    return {
        updatedAt: new Date(now).toISOString(),
        office: {
            source: officeFresh ? 'live' : 'simulated',
            currentKw: office.at(-1)?.kw ?? 0,
            series: office,
        },
        vehicle: {
            source: vehicleFresh ? 'live' : 'simulated',
            kmToday: car.kmToday,
            litersPer100km: car.litersPer100km,
            stops: car.stops,
        },
    };
}
