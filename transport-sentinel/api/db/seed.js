/**
 * Database seeder — runs once at server startup.
 *
 * Collections created:
 *   fleet_registry/{trainId}          Static train attributes (manufacturer, model, etc.)
 *   routes/{routeId}                  Route definitions with stops
 *   maintenance_orders/{orderId}      Work orders (WO-YYYY-XXXX)
 *   incidents/{incidentId}            Safety incidents
 *   history/{trainId}_{date}          Daily metrics per train (30 days)
 *   energy_daily/{date}               Daily energy aggregates
 *   commercial_pax/{date}             Daily passenger commercial data
 *   commercial_cargo/{date}           Daily freight commercial data
 *   _meta/seed                        Seed timestamp (idempotency flag)
 */

import { getDB } from './firestore.js';
import {
    TRAINS, ROUTES,
    generateMaintenanceOrders,
    generateIncidents,
    generateHistoricalData,
    generateEnergyData,
    generateCommercialData,
} from '../generators.js';

const SEED_DOC = '_meta/seed';

async function commitBatch(db, ops) {
    const LIMIT = 490;
    for (let i = 0; i < ops.length; i += LIMIT) {
        const batch = db.batch();
        ops.slice(i, i + LIMIT).forEach(([ref, data]) => batch.set(ref, data));
        await batch.commit();
    }
}

export async function seedDatabase() {
    const db = getDB();
    if (!db) return;

    // Idempotency: skip if already seeded
    const flag = await db.doc(SEED_DOC).get();
    if (flag.exists) {
        console.log('[db] Already seeded at', flag.data().seededAt);
        return;
    }

    console.log('[db] Seeding database...');
    const t0 = Date.now();

    // ── Fleet registry ────────────────────────────────────────────────────────
    await commitBatch(db, TRAINS.map(t => [db.collection('fleet_registry').doc(t.id), t]));
    console.log(`[db]   fleet_registry: ${TRAINS.length} trains`);

    // ── Routes ────────────────────────────────────────────────────────────────
    await commitBatch(db, ROUTES.map(r => [db.collection('routes').doc(r.id), r]));
    console.log(`[db]   routes: ${ROUTES.length} routes`);

    // ── Maintenance orders ────────────────────────────────────────────────────
    const wos = generateMaintenanceOrders();
    await commitBatch(db, wos.map(w => [db.collection('maintenance_orders').doc(w.id), w]));
    console.log(`[db]   maintenance_orders: ${wos.length} orders`);

    // ── Incidents ─────────────────────────────────────────────────────────────
    const incidents = generateIncidents();
    await commitBatch(db, incidents.map(i => [db.collection('incidents').doc(i.id), i]));
    console.log(`[db]   incidents: ${incidents.length} incidents`);

    // ── Historical data (30 days × first 12 trains) ───────────────────────────
    const histOps = [];
    const histTrains = TRAINS.slice(0, 12).map(t => t.id);
    for (const trainId of histTrains) {
        for (const day of generateHistoricalData(30, trainId)) {
            histOps.push([
                db.collection('history').doc(`${trainId}_${day.date}`),
                { trainId, ...day },
            ]);
        }
    }
    await commitBatch(db, histOps);
    console.log(`[db]   history: ${histOps.length} daily records`);

    // ── Energy ────────────────────────────────────────────────────────────────
    const energy = generateEnergyData(30);
    await commitBatch(db, energy.map(d => [db.collection('energy_daily').doc(d.date), d]));
    console.log(`[db]   energy_daily: ${energy.length} records`);

    // ── Commercial ────────────────────────────────────────────────────────────
    const pax = generateCommercialData('pasajeros', 30);
    await commitBatch(db, pax.map(d => [db.collection('commercial_pax').doc(d.date), d]));

    const cargo = generateCommercialData('carga', 30);
    await commitBatch(db, cargo.map(d => [db.collection('commercial_cargo').doc(d.date), d]));
    console.log(`[db]   commercial: ${pax.length + cargo.length} records`);

    // ── Seed flag ─────────────────────────────────────────────────────────────
    await db.doc(SEED_DOC).set({
        seededAt:   new Date().toISOString(),
        trainCount: TRAINS.length,
        routeCount: ROUTES.length,
    });

    console.log(`[db] Seeding complete in ${Date.now() - t0}ms ✓`);
}
