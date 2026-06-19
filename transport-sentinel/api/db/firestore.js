/**
 * Firestore Admin client.
 *
 * On Cloud Run: uses Application Default Credentials (ADC) automatically.
 *   The Cloud Run service account needs the "Cloud Datastore User" IAM role.
 *
 * Locally: set GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa-key.json
 *   OR run the Firestore emulator and set FIRESTORE_EMULATOR_HOST=localhost:8090
 *
 * If credentials are not available, isAvailable() returns false and the
 * server falls back to in-memory generators for every request.
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let db   = null;
let live = false;

export async function initFirestore() {
    if (getApps().length > 0) {
        db   = getFirestore();
        live = true;
        return true;
    }

    try {
        const projectId = process.env.FIREBASE_PROJECT_ID
            || process.env.GOOGLE_CLOUD_PROJECT
            || process.env.GCLOUD_PROJECT;

        // If a service-account JSON is passed inline (base64 or raw)
        const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (saJson) {
            const parsed = JSON.parse(
                saJson.startsWith('{') ? saJson : Buffer.from(saJson, 'base64').toString()
            );
            initializeApp({ credential: cert(parsed), projectId: parsed.project_id || projectId });
        } else {
            // ADC — works automatically on Cloud Run / GCE
            initializeApp(projectId ? { projectId } : {});
        }

        db   = getFirestore();
        live = true;
        console.log('[db] Firestore connected ✓');
        return true;
    } catch (err) {
        console.warn('[db] Firestore unavailable — using in-memory generators:', err.message);
        return false;
    }
}

export const isAvailable = () => live;
export const getDB       = () => db;
