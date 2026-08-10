import {
    Timestamp,
    addDoc,
    collection,
    doc,
    getDocs,
    limit as fbLimit,
    orderBy,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';
import { getDb, isConfigured, type Millis } from '@cognitex/data';

import { fromDateKey, isRootCause, toDateKey } from '../domain';
import type {
    AdjustmentStatus,
    Constraint,
    ConstraintStatus,
    DraftEntry,
    EnergyLevel,
    FailureEntry,
} from '../domain';

/**
 * Firestore for this console's two collections.
 *
 * `@cognitex/data` owns `readings` and `alerts`, which every platform shares.
 * A failure entry is neither: it carries prose, a taxonomy code and a
 * verification state, and forcing it into `ProductivityReading`'s three
 * numeric slots is precisely the aliasing the packages README was written to
 * stop. So the two domain collections live here, and only `getDb()` and
 * `isConfigured()` come from the shared package.
 *
 * The rules from that package still hold: every query is filtered by `orgId`,
 * and nothing here is called before `isConfigured()` has been checked.
 *
 * This is what makes the daily entry real. Until now `handleNewEntry` did
 * `setEntries(prev => [entry, ...prev])` and nothing else — the entry a user
 * typed lived in React state until they refreshed the page.
 */

const ENTRIES = 'productivityEntries';
const CONSTRAINTS = 'productivityConstraints';

function toMillis(value: unknown): Millis {
    if (value instanceof Timestamp) return value.toMillis();
    if (typeof value === 'number') return value;
    return 0;
}

const ADJUSTMENT_STATUSES: readonly AdjustmentStatus[] = ['pendiente', 'si', 'parcial', 'no'];
const CONSTRAINT_STATUSES: readonly ConstraintStatus[] = [
    'activa',
    'en_experimento',
    'neutralizada',
];

function asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function asEnergy(value: unknown): EnergyLevel {
    const level = Math.round(Number(value));
    if (level >= 1 && level <= 5) return level as EnergyLevel;
    return 3;
}

/**
 * Documents are validated on the way in, not cast.
 *
 * A `as FailureEntry` on `doc.data()` is a lie the compiler cannot catch: the
 * document was written by some earlier version of this app, or by a script.
 * Anything unrecognised falls back to a safe value rather than rendering as
 * `undefined` three components later.
 */
function toEntry(id: string, data: Record<string, unknown>): FailureEntry {
    const dateKey = asString(data.date);
    // A document written without `at` still has its calendar day; falling back
    // to midnight of that day beats sorting the row to 1 January 1970.
    const rawAt = toMillis(data.at);
    const fallback = fromDateKey(dateKey);
    const at = rawAt || (Number.isNaN(fallback) ? 0 : fallback);

    const status = asString(data.adjustmentStatus) as AdjustmentStatus;
    const rootCause = asString(data.rootCause);

    return {
        id,
        orgId: asString(data.orgId),
        date: dateKey || toDateKey(at),
        at,
        failure: asString(data.failure),
        rootCause: isRootCause(rootCause) ? rootCause : 'sobrecompromiso',
        adjustment: asString(data.adjustment),
        adjustmentStatus: ADJUSTMENT_STATUSES.includes(status) ? status : 'pendiente',
        win: asString(data.win),
        energy: asEnergy(data.energy),
        goalId: asString(data.goalId),
    };
}

function toConstraint(id: string, data: Record<string, unknown>): Constraint {
    const status = asString(data.status) as ConstraintStatus;
    const rootCause = asString(data.rootCause);

    return {
        id,
        orgId: asString(data.orgId),
        description: asString(data.description),
        rootCause: isRootCause(rootCause) ? rootCause : 'sobrecompromiso',
        status: CONSTRAINT_STATUSES.includes(status) ? status : 'activa',
        since: toMillis(data.since),
        goalIds: Array.isArray(data.goalIds) ? data.goalIds.filter(isNonEmptyString) : [],
    };
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0;
}

export async function fetchEntries(options: {
    orgId: string;
    since: Millis;
    max?: number;
}): Promise<FailureEntry[]> {
    if (!isConfigured()) throw new Error('Firestore no está configurado');

    const snapshot = await getDocs(
        query(
            collection(getDb(), ENTRIES),
            where('orgId', '==', options.orgId),
            where('at', '>=', Timestamp.fromMillis(options.since)),
            orderBy('at', 'desc'),
            fbLimit(options.max ?? 500)
        )
    );

    return snapshot.docs.map((document) => toEntry(document.id, document.data()));
}

export async function insertEntry(draft: DraftEntry): Promise<FailureEntry> {
    if (!isConfigured()) throw new Error('Firestore no está configurado');

    const reference = await addDoc(collection(getDb(), ENTRIES), {
        ...draft,
        at: Timestamp.fromMillis(draft.at),
    });

    return { ...draft, id: reference.id };
}

export async function updateEntryStatus(
    entryId: string,
    status: AdjustmentStatus
): Promise<void> {
    if (!isConfigured()) throw new Error('Firestore no está configurado');

    await updateDoc(doc(getDb(), ENTRIES, entryId), { adjustmentStatus: status });
}

export async function fetchConstraints(orgId: string): Promise<Constraint[]> {
    if (!isConfigured()) throw new Error('Firestore no está configurado');

    const snapshot = await getDocs(
        query(collection(getDb(), CONSTRAINTS), where('orgId', '==', orgId), fbLimit(200))
    );

    return snapshot.docs.map((document) => toConstraint(document.id, document.data()));
}

export async function updateConstraintStatus(constraint: Constraint): Promise<void> {
    if (!isConfigured()) throw new Error('Firestore no está configurado');

    await updateDoc(doc(getDb(), CONSTRAINTS, constraint.id), {
        status: constraint.status,
        since: Timestamp.fromMillis(constraint.since),
    });
}
