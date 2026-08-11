import type { Status } from '@cognitex/theme';

import type { AlertCategory, RailAlert, WorkOrder, WorkOrderStatus } from './types';

/**
 * The wire boundary.
 *
 * Everything the API returns arrives as `unknown` and leaves this module as a
 * domain type or not at all. Two of the audit's live defects were producers
 * and consumers disagreeing about a field, and a boundary is the only place a
 * type checker can help with that — inside the app the types already hold.
 *
 * The alert parser deliberately accepts both spellings. During a rolling
 * Cloud Run deploy the old revision is still answering, and a ticker that
 * goes blank for ninety seconds in a control room is a real cost; reading
 * both is cheap.
 */

function asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
}

function str(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function numOrNull(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

// ── Alerts ──────────────────────────────────────────────────────────────────

const ALERT_CATEGORIES: readonly AlertCategory[] = [
    'MANTENIMIENTO',
    'PREDICTIVO',
    'RETRASO',
    'OCUPACION',
    'ENERGIA',
    'COMBUSTIBLE',
    'INFO',
];

/** The legacy `priority` vocabulary, mapped onto the shared status set. */
const PRIORITY_TO_STATUS: Record<string, Status> = {
    CRITICAL: 'alert',
    CRITICO: 'alert',
    WARNING: 'warning',
    ADVERTENCIA: 'warning',
    INFO: 'ok',
};

const STATUSES: readonly Status[] = ['ok', 'warning', 'alert', 'offline'];

/**
 * `HH:mm` today, in local time.
 *
 * The old API sent alert times pre-formatted for display, which is why the
 * client generator's `timestamp` and the API's `time` could never line up.
 * The API now sends epoch millis; this exists so a stale revision's `time`
 * still produces a real instant instead of the blank the ticker used to show.
 * A stamp more than five minutes in the future belongs to yesterday's shift.
 */
function clockToMillis(clock: string, now: number): number | null {
    const match = /^(\d{1,2}):(\d{2})$/.exec(clock);
    if (!match) return null;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;

    const at = new Date(now);
    at.setHours(hours, minutes, 0, 0);

    const millis = at.getTime();
    return millis > now + 5 * 60_000 ? millis - 86_400_000 : millis;
}

export function toRailAlert(raw: unknown, now: number = Date.now()): RailAlert | null {
    const record = asRecord(raw);
    if (!record) return null;

    const id = str(record.id);
    if (!id) return null;

    // Canonical `at`, else the legacy pre-formatted `time`.
    const at =
        numOrNull(record.at) ??
        (typeof record.time === 'string' ? clockToMillis(record.time, now) : null) ??
        now;

    // Canonical `status`, else the legacy `priority`.
    const rawStatus = str(record.status);
    const status: Status = STATUSES.includes(rawStatus as Status)
        ? (rawStatus as Status)
        : (PRIORITY_TO_STATUS[str(record.priority).toUpperCase()] ?? 'ok');

    const rawCategory = str(record.category) || str(record.type);
    const category: AlertCategory = ALERT_CATEGORIES.includes(rawCategory as AlertCategory)
        ? (rawCategory as AlertCategory)
        : 'INFO';

    return {
        id,
        orgId: str(record.orgId, 'demo'),
        // '' means "the whole network", which is what a null trainId meant.
        assetId: str(record.assetId) || str(record.trainId),
        assetName: str(record.assetName) || str(record.trainName) || null,
        at,
        status,
        category,
        message: str(record.message),
        acknowledgedAt: numOrNull(record.acknowledgedAt),
    };
}

// ── Work orders ─────────────────────────────────────────────────────────────

const WORK_ORDER_STATUSES: readonly WorkOrderStatus[] = [
    'PENDIENTE',
    'EN_CURSO',
    'COMPLETADO',
    'VENCIDO',
];

/**
 * `EN_CURSO` is canonical. `EN_PROGRESO` was the second spelling, and because
 * the card only knew the first one every in-progress order rendered with the
 * PENDIENTE clock icon — an order actively being worked looked untouched.
 */
export function toWorkOrderStatus(raw: unknown): WorkOrderStatus {
    const value = str(raw).toUpperCase();
    if (value === 'EN_PROGRESO' || value === 'EN PROGRESO' || value === 'EN CURSO') {
        return 'EN_CURSO';
    }
    return WORK_ORDER_STATUSES.includes(value as WorkOrderStatus)
        ? (value as WorkOrderStatus)
        : 'PENDIENTE';
}

const WORK_ORDER_KINDS = ['PREVENTIVO', 'CORRECTIVO', 'PREDICTIVO', 'INSPECCION'] as const;
const WORK_ORDER_PRIORITIES = ['ALTA', 'MEDIA', 'BAJA'] as const;
const WORK_ORDER_TRIGGERS = ['KM', 'COND', 'TIEMPO'] as const;

function oneOf<T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T {
    const value = str(raw).toUpperCase();
    return allowed.includes(value as T) ? (value as T) : fallback;
}

export function toWorkOrder(raw: unknown): WorkOrder | null {
    const record = asRecord(raw);
    if (!record) return null;

    const id = str(record.id);
    if (!id) return null;

    return {
        id,
        assetId: str(record.assetId),
        type: oneOf(record.type, WORK_ORDER_KINDS, 'PREVENTIVO'),
        priority: oneOf(record.priority, WORK_ORDER_PRIORITIES, 'BAJA'),
        status: toWorkOrderStatus(record.status),
        component: str(record.component),
        triggerType: oneOf(record.triggerType, WORK_ORDER_TRIGGERS, 'TIEMPO'),
        triggerValue: numOrNull(record.triggerValue),
        currentValue: numOrNull(record.currentValue),
        estimatedHours: num(record.estimatedHours),
        depot: str(record.depot),
        scheduledDate: str(record.scheduledDate),
        aiPredictedFailureDate: str(record.aiPredictedFailureDate) || null,
        remainingLifePct: numOrNull(record.remainingLifePct),
        aiConfidencePct: numOrNull(record.aiConfidencePct),
    };
}

/** Maps a parser over a response that should have been an array. */
export function parseList<T>(raw: unknown, parse: (item: unknown) => T | null): T[] {
    if (!Array.isArray(raw)) return [];
    const parsed: T[] = [];
    for (const item of raw) {
        const value = parse(item);
        if (value !== null) parsed.push(value);
    }
    return parsed;
}
