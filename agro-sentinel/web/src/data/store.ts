import {
    Timestamp,
    collection,
    doc,
    getDoc,
    getDocs,
    limit as fbLimit,
    orderBy,
    query,
    updateDoc,
} from 'firebase/firestore';
import { getDb, isConfigured } from '@cognitex/data';

import type { GreenhouseSample, Millis, ThermalScan } from '../domain';

/**
 * The two collections that belong to this console alone.
 *
 * `@cognitex/data` owns `readings` and `alerts`, which every platform shares,
 * and this file never reimplements them. What it does own is the pipeline's
 * own schema: `greenhouses/{sensorId}` is the live-state document that
 * `cloud/main.py:201` writes on every message, and its `thermal_scans`
 * subcollection is what `cloud/thermal.py:91` writes per image. Both use the
 * Python field names — `temperature`, `vpd_kpa`, `max_temp_detected` — so the
 * translation into the typed domain happens here, once, at the edge.
 *
 * Documents are validated, not cast. `doc.data() as GreenhouseSample` would be
 * a lie the compiler cannot check: these documents are written by a Python
 * function this repository deploys separately and whose schema has already
 * drifted once.
 */

const GREENHOUSES = 'greenhouses';
const THERMAL_SCANS = 'thermal_scans';
const ALERTS = 'alerts';

function toMillis(value: unknown): Millis {
    if (value instanceof Timestamp) return value.toMillis();
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

function toNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Zero is a measurement; only a missing or non-numeric field falls back. */
function toNumberOr(value: unknown, fallback: number): number {
    return toNumber(value) ?? fallback;
}

function toString(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

/**
 * The live-state document for one greenhouse.
 *
 * Returns null when the document does not exist, which is the normal state
 * today: nothing has ever published to this collection, because the edge
 * agent cannot get a message past `cloud/main.py`'s sensor-ID check. See
 * ../../PIPELINE_STATUS.md.
 */
export async function fetchLiveState(options: {
    orgId: string;
    farmId: string;
}): Promise<GreenhouseSample | null> {
    if (!isConfigured()) throw new Error('Firestore no está configurado');

    const snapshot = await getDoc(doc(getDb(), GREENHOUSES, options.farmId));
    if (!snapshot.exists()) return null;

    const data = snapshot.data();

    // Tenancy is enforced by the security rules; this is the second lock. A
    // document written before the pipeline carried `orgId` has none, and is
    // accepted — the rules are what stop another tenant's document arriving
    // here at all.
    const documentOrg = toString(data.orgId);
    if (documentOrg && documentOrg !== options.orgId) return null;

    return {
        platform: 'agro',
        orgId: options.orgId,
        assetId: options.farmId,
        at: toMillis(data.last_update),
        airTemperature: toNumberOr(data.temperature, Number.NaN),
        humidity: toNumberOr(data.humidity, Number.NaN),
        vpd: toNumberOr(data.vpd_kpa, Number.NaN),
        co2: toNumberOr(data.co2_ppm, Number.NaN),
        soilMoisture: toNumberOr(data.soil_moisture, Number.NaN),
        par: toNumberOr(data.par_umol, Number.NaN),
        batteryPct: toNumber(data.battery_level),
        rssiDbm: toNumber(data.rssi_dbm),
        soilEc: toNumber(data.soil_ec),
        soilTemperature: toNumber(data.soil_temp_c),
    };
}

/**
 * Thermal scans for one greenhouse, newest first.
 *
 * Every scan is flagged `stub` unless the writer recorded which model
 * produced it. Nothing writes that field today — `cloud/thermal.py:78-86`
 * returns a hardcoded 42.5 °C and never calls the vision model it
 * constructs — so every scan read back from Firestore is marked unverified
 * and the view says so. Absence of provenance is not evidence of analysis.
 */
export async function fetchThermalScans(options: {
    orgId: string;
    farmId: string;
    max?: number;
}): Promise<ThermalScan[]> {
    if (!isConfigured()) throw new Error('Firestore no está configurado');

    const snapshot = await getDocs(
        query(
            collection(getDb(), GREENHOUSES, options.farmId, THERMAL_SCANS),
            orderBy('created_at', 'desc'),
            fbLimit(options.max ?? 20)
        )
    );

    return snapshot.docs.map((document) => {
        const data = document.data();
        const analysis = (data.analysis ?? {}) as Record<string, unknown>;

        return {
            id: document.id,
            farmId: options.farmId,
            at: toMillis(data.created_at ?? analysis.timestamp),
            maxTemperature: toNumberOr(analysis.max_temp_detected, Number.NaN),
            ambientTemperature: toNumber(analysis.ambient_temp_c),
            anomaly: analysis.anomaly_detected === true,
            description: toString(analysis.description),
            stub: toString(analysis.model) === '',
        };
    });
}

/**
 * Acknowledges one alert.
 *
 * The shared `alerts` collection carries `acknowledgedAt`, and
 * `@cognitex/data` reads it but has no writer — acknowledgement is an
 * operator action rather than a pipeline one, so it lives with the console
 * that offers the button.
 */
export async function acknowledgeAlert(alertId: string, at: Millis): Promise<void> {
    if (!isConfigured()) throw new Error('Firestore no está configurado');

    await updateDoc(doc(getDb(), ALERTS, alertId), {
        acknowledgedAt: Timestamp.fromMillis(at),
    });
}
