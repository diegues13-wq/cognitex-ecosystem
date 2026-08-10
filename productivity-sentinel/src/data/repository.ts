import { appendReading, isConfigured, type DataSource, type Millis } from '@cognitex/data';

import {
    addDays,
    computePpc,
    tallyConstraints,
    transitionConstraint,
    type AdjustmentStatus,
    type Constraint,
    type ConstraintStatus,
    type DraftEntry,
    type FailureEntry,
} from '../domain';
import { generateData } from './generate';
import {
    fetchConstraints,
    fetchEntries,
    insertEntry,
    updateConstraintStatus,
    updateEntryStatus,
} from './store';

/**
 * The console's only data entry point.
 *
 * Two rules, both taken from `@cognitex/data`'s repository:
 *
 *  1. Firestore when it is configured, the generator otherwise.
 *  2. **The answer always says which one it was.** Every result carries a
 *     `source`, so the view can render `<DataSourceBadge>` and the user knows
 *     whether they are looking at their own log or at a demonstration. The old
 *     app generated 30 days of failures in the browser and presented them as
 *     the user's own history with nothing on screen to say otherwise.
 */

export interface ConsoleSnapshot {
    entries: FailureEntry[];
    constraints: Constraint[];
    source: DataSource;
    /** When the store answered. Null in generated mode. */
    updatedAt: Millis | null;
}

export interface WriteResult<T> {
    value: T;
    source: DataSource;
}

export async function loadSnapshot(options: {
    orgId: string;
    days: number;
    now: Millis;
}): Promise<ConsoleSnapshot> {
    if (!isConfigured()) {
        const generated = generateData(options);
        return { ...generated, source: 'generated', updatedAt: null };
    }

    const since = addDays(options.now, -options.days);
    const [entries, constraints] = await Promise.all([
        fetchEntries({ orgId: options.orgId, since }),
        fetchConstraints(options.orgId),
    ]);

    return { entries, constraints, source: 'store', updatedAt: Date.now() };
}

/**
 * Persists a new entry.
 *
 * In generated mode it returns an entry with a local id so the demo still
 * responds to input — but the caller is told the source, and the badge stays
 * amber. Nothing pretends the write reached a database.
 */
export async function createEntry(draft: DraftEntry): Promise<WriteResult<FailureEntry>> {
    if (!isConfigured()) {
        return {
            value: { ...draft, id: `local-${draft.at}-${Math.random().toString(36).slice(2, 8)}` },
            source: 'generated',
        };
    }

    return { value: await insertEntry(draft), source: 'store' };
}

/** Records whether yesterday's commitment was met. */
export async function verifyEntry(
    entry: FailureEntry,
    status: AdjustmentStatus
): Promise<WriteResult<FailureEntry>> {
    const updated: FailureEntry = { ...entry, adjustmentStatus: status };

    if (!isConfigured()) return { value: updated, source: 'generated' };

    await updateEntryStatus(entry.id, status);
    return { value: updated, source: 'store' };
}

/** Moves a constraint across the board. Throws on an illegal transition. */
export async function moveConstraint(
    constraint: Constraint,
    to: ConstraintStatus,
    now: Millis
): Promise<WriteResult<Constraint>> {
    const updated = transitionConstraint(constraint, to, now);

    if (!isConfigured()) return { value: updated, source: 'generated' };

    await updateConstraintStatus(updated);
    return { value: updated, source: 'store' };
}

/**
 * Publishes the daily rollup to the shared `readings` collection.
 *
 * This is the platform's contribution to the cross-console view: PPC, open
 * constraints and the dominant cause, in the `ProductivityReading` shape that
 * `@cognitex/data` defines for it — the typed slot, used for the measurement
 * it was named after.
 *
 * Best-effort: a failed rollup must never cost the user the entry they just
 * wrote, so it resolves either way and reports what happened.
 */
export async function publishRollup(options: {
    orgId: string;
    entries: readonly FailureEntry[];
    constraints: readonly Constraint[];
    dominantCause: string;
    now: Millis;
}): Promise<boolean> {
    if (!isConfigured()) return false;

    try {
        await appendReading({
            platform: 'productivity',
            orgId: options.orgId,
            assetId: options.orgId,
            at: options.now,
            planCompliance: computePpc(options.entries).ppc,
            openConstraints: tallyConstraints(options.constraints).open,
            rootCause: options.dominantCause,
        });
        return true;
    } catch (error) {
        console.warn('No se pudo publicar el resumen diario', error);
        return false;
    }
}
