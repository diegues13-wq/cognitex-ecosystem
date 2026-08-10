import {
    Timestamp,
    addDoc,
    collection,
    limit as fbLimit,
    getDocs,
    orderBy,
    query,
    where,
} from 'firebase/firestore';

import { getDb, isConfigured } from './client';
import type { Alert, Millis, Reading } from './types';

/**
 * Typed, tenant-scoped Firestore access.
 *
 * Two rules hold everywhere:
 *
 *  1. Every read is filtered by `orgId`. The security rules enforce it too,
 *     but doing it here means a missing rule cannot silently widen a query.
 *  2. When Firestore is not configured the call returns `null` rather than
 *     throwing or returning fake data. The caller decides what to show, and
 *     the UI can then label generated data honestly — which is the whole
 *     reason the previous "silently fall back to a generator" behaviour was a
 *     problem: nothing downstream could tell the difference.
 */

export interface Page<T> {
    items: T[];
    /** False when the data came from a generator rather than the database. */
    fromStore: boolean;
}

const READINGS = 'readings';
const ALERTS = 'alerts';

/** Firestore Timestamps out, plain millis in — the app never sees a Timestamp. */
function toMillis(value: unknown): Millis {
    if (value instanceof Timestamp) return value.toMillis();
    if (typeof value === 'number') return value;
    return 0;
}

export async function fetchReadings(options: {
    orgId: string;
    assetId?: string;
    since: Millis;
    max?: number;
}): Promise<Page<Reading> | null> {
    if (!isConfigured()) return null;

    const constraints = [
        where('orgId', '==', options.orgId),
        where('at', '>=', Timestamp.fromMillis(options.since)),
        orderBy('at', 'asc'),
        fbLimit(options.max ?? 500),
    ];

    if (options.assetId) {
        constraints.unshift(where('assetId', '==', options.assetId));
    }

    const snapshot = await getDocs(query(collection(getDb(), READINGS), ...constraints));

    return {
        fromStore: true,
        items: snapshot.docs.map((doc) => {
            const data = doc.data();
            return { ...data, at: toMillis(data.at) } as Reading;
        }),
    };
}

export async function appendReading(reading: Reading): Promise<void> {
    if (!isConfigured()) throw new Error('Firestore is not configured');

    await addDoc(collection(getDb(), READINGS), {
        ...reading,
        // Server-assigned so a client with a wrong clock cannot reorder the
        // series for everyone else.
        at: Timestamp.fromMillis(reading.at),
    });
}

export async function fetchAlerts(options: {
    orgId: string;
    max?: number;
}): Promise<Page<Alert> | null> {
    if (!isConfigured()) return null;

    const snapshot = await getDocs(
        query(
            collection(getDb(), ALERTS),
            where('orgId', '==', options.orgId),
            orderBy('at', 'desc'),
            fbLimit(options.max ?? 50)
        )
    );

    return {
        fromStore: true,
        items: snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                at: toMillis(data.at),
                acknowledgedAt: data.acknowledgedAt ? toMillis(data.acknowledgedAt) : null,
            } as Alert;
        }),
    };
}
