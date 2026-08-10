/**
 * Firestore access for the live demo.
 *
 * Uses @google-cloud/firestore directly rather than firebase-admin: this
 * service only needs Firestore, and firebase-admin drags in
 * @google-cloud/storage, whose dependency chain currently carries eight
 * moderate advisories. Same credentials either way — Application Default
 * Credentials on Cloud Run (the service account needs roles/datastore.user),
 * GOOGLE_APPLICATION_CREDENTIALS or FIRESTORE_EMULATOR_HOST locally.
 *
 * If Firestore is unavailable the API still answers — it falls back to the
 * simulator and labels the payload `source: "simulated"`, which the site
 * renders differently. It never presents synthetic numbers as measured ones.
 */

import { Firestore, Timestamp } from '@google-cloud/firestore';

const OFFICE_COLLECTION = 'demo_office_readings';
const VEHICLE_COLLECTION = 'demo_vehicle_days';

let db = null;
let live = false;

export async function initStore() {
    if (db) return live;

    try {
        const projectId =
            process.env.FIREBASE_PROJECT_ID ||
            process.env.GOOGLE_CLOUD_PROJECT ||
            process.env.GCLOUD_PROJECT;

        db = new Firestore(projectId ? { projectId } : {});

        // The constructor is lazy, so a bad configuration would not surface
        // until the first read — during a request. Force one round trip now
        // and fall back to simulation at startup instead.
        await db.listCollections();

        live = true;
        console.log('[store] Firestore connected');
        return true;
    } catch (err) {
        db = null;
        live = false;
        console.warn('[store] Firestore unavailable, serving simulated data:', err.message);
        return false;
    }
}

export const isAvailable = () => live;

/**
 * Appends one power reading.
 * `at` is server-assigned so a device with a wrong clock cannot poison the
 * series ordering.
 */
export async function saveOfficeReading(kw) {
    if (!live) throw new Error('store unavailable');

    await db.collection(OFFICE_COLLECTION).add({
        kw,
        at: Timestamp.now(),
    });
}

/** Readings from the last `hours`, oldest first. */
export async function readOfficeSeries(hours = 24) {
    if (!live) return [];

    const since = Timestamp.fromMillis(Date.now() - hours * 60 * 60 * 1000);
    const snapshot = await db
        .collection(OFFICE_COLLECTION)
        .where('at', '>=', since)
        .orderBy('at', 'asc')
        .get();

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return { at: data.at.toMillis(), kw: data.kw };
    });
}

/**
 * Upserts today's vehicle summary. One document per calendar day, keyed by
 * date, so a device reporting every few minutes overwrites rather than
 * accumulating.
 */
export async function saveVehicleDay(dayKey, payload) {
    if (!live) throw new Error('store unavailable');

    await db
        .collection(VEHICLE_COLLECTION)
        .doc(dayKey)
        .set({ ...payload, at: Timestamp.now() }, { merge: true });
}

export async function readVehicleDay(dayKey) {
    if (!live) return null;

    const doc = await db.collection(VEHICLE_COLLECTION).doc(dayKey).get();
    if (!doc.exists) return null;

    const data = doc.data();
    return {
        kmToday: data.kmToday ?? 0,
        litersPer100km: data.litersPer100km ?? 0,
        stops: data.stops ?? 0,
        at: data.at?.toMillis?.() ?? 0,
    };
}

/**
 * Drops readings older than the retention window. Called from a scheduled
 * endpoint rather than a cron container — the volume is trivial.
 */
export async function pruneOfficeReadings(retentionDays = 7) {
    if (!live) return 0;

    const cutoff = Timestamp.fromMillis(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const snapshot = await db
        .collection(OFFICE_COLLECTION)
        .where('at', '<', cutoff)
        .limit(500)
        .get();

    if (snapshot.empty) return 0;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    return snapshot.size;
}
