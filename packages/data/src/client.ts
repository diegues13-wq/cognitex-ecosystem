import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Firestore access for the browser.
 *
 * The platforms talk to Firestore directly through the Web SDK rather than
 * each running its own Express API. Access control lives in Firestore
 * security rules keyed on the signed-in user's `orgId` custom claim, which is
 * the same boundary an API would enforce — without five more Cloud Run
 * services to deploy, monitor and pay for.
 *
 * transport-sentinel keeps its Node API, because streaming Vertex AI
 * responses genuinely needs a server that can hold a credential.
 *
 * When no Firebase config is present the app runs unconfigured and every
 * repository falls back to generated data, exactly as before — but the UI is
 * told, so it can say so instead of pretending.
 */

export interface FirebaseSettings {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let configured = false;

/** Reads Vite env vars. Returns null when the app was built without them. */
export function readSettings(env: Record<string, string | undefined>): FirebaseSettings | null {
    const apiKey = env.VITE_FIREBASE_API_KEY;
    if (!apiKey) return null;

    return {
        apiKey,
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
        projectId: env.VITE_FIREBASE_PROJECT_ID ?? '',
        storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
        messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
        appId: env.VITE_FIREBASE_APP_ID ?? '',
    };
}

export function initData(settings: FirebaseSettings | null): boolean {
    if (!settings) {
        configured = false;
        return false;
    }

    app = getApps().length > 0 ? getApps()[0]! : initializeApp(settings);
    db = getFirestore(app);
    configured = true;
    return true;
}

/** True when a real Firestore is behind the repositories. */
export const isConfigured = (): boolean => configured;

export function getDb(): Firestore {
    if (!db) throw new Error('Firestore is not configured — check isConfigured() first');
    return db;
}

export function getApp(): FirebaseApp {
    if (!app) throw new Error('Firebase is not configured — check isConfigured() first');
    return app;
}
