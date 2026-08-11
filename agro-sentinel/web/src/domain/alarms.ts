import type { Status } from '@cognitex/theme';

import type {
    Alarm,
    AlarmCondition,
    AlarmLevel,
    Band,
    ChannelId,
    GreenhouseSample,
    Millis,
} from './types';

/**
 * ISA-18.2 alarm management.
 *
 * The limits are exactly the ones `cloud/main.py` declares — CRITICAL at
 * lines 46-54, WARNING at lines 56-63 — so the console and the ingest
 * function raise the same alarms from the same numbers. What is added here is
 * the part of ANSI/ISA-18.2-2016 the Python does not implement:
 *
 *  · **Deadband** (§ "alarm attributes"). The Python re-evaluates every
 *    message from scratch, so a temperature hovering at 38.0 °C alarms,
 *    clears, alarms and clears once per reading — the chattering alarm the
 *    standard exists to prevent. An alarm here clears only once the value is
 *    back inside its limit *by the deadband*, which is the standard's
 *    recommended treatment for analogue signals.
 *
 *  · **A lifecycle** (§ "alarm state model"). A condition is instantaneous; an
 *    alarm is raised, may be acknowledged, and later returns to normal. The
 *    Python overwrites `active_alerts` on every message, so an operator has
 *    nothing to acknowledge and no record that anything happened.
 *
 *  · **Priority**. CRITICAL before WARNING, and within a level the channels
 *    that endanger the crop first. A flat list sorted by insertion order — the
 *    Python's `critical_alerts + warning_alerts` — is not a priority.
 *
 * Everything is a pure function of (previous alarms, new sample, clock), so
 * the state machine is testable without a timer or a database.
 */

/** CRITICAL limits — cloud/main.py:46-54. */
export const CRITICAL_LIMITS: Readonly<Partial<Record<ChannelId, Band>>> = {
    airTemperature: { low: 10, high: 38 },
    humidity: { low: 25, high: 98 },
    vpd: { low: 0.2, high: 2.0 },
    co2: { low: 300, high: 1800 },
    soilMoisture: { low: 25, high: 92 },
    batteryPct: { low: 15, high: null },
    rssiDbm: { low: -90, high: null },
};

/** WARNING limits — cloud/main.py:56-63. */
export const WARNING_LIMITS: Readonly<Partial<Record<ChannelId, Band>>> = {
    airTemperature: { low: 15, high: 30 },
    humidity: { low: 50, high: 85 },
    vpd: { low: 0.4, high: 1.2 },
    co2: { low: 400, high: 1200 },
    soilMoisture: { low: 45, high: 80 },
    par: { low: 200, high: 800 },
};

/**
 * Per-channel deadband, in the channel's own unit.
 *
 * ISA-18.2 suggests roughly 1-5% of the operating span for a noisy analogue
 * input. These are the low end of that: enough to absorb sensor noise, small
 * enough that a genuine excursion still clears promptly.
 */
export const DEADBAND: Readonly<Record<ChannelId, number>> = {
    airTemperature: 0.5,
    humidity: 2,
    vpd: 0.05,
    co2: 50,
    soilMoisture: 2,
    par: 25,
    batteryPct: 2,
    rssiDbm: 3,
};

/**
 * Priority within a level: what a grower loses first.
 *
 * Lower number is more urgent. Soil moisture and temperature kill a crop in
 * hours; a flat battery costs a maintenance visit.
 */
const CHANNEL_PRIORITY: Readonly<Record<ChannelId, number>> = {
    airTemperature: 0,
    soilMoisture: 1,
    co2: 2,
    vpd: 3,
    humidity: 4,
    par: 5,
    batteryPct: 6,
    rssiDbm: 7,
};

const LIMITS: Readonly<Record<AlarmLevel, Readonly<Partial<Record<ChannelId, Band>>>>> = {
    CRITICAL: CRITICAL_LIMITS,
    WARNING: WARNING_LIMITS,
};

/** Every channel an alarm can be raised on, in evaluation order. */
const EVALUATED: readonly ChannelId[] = [
    'airTemperature',
    'humidity',
    'vpd',
    'co2',
    'soilMoisture',
    'par',
    'batteryPct',
    'rssiDbm',
];

function valueOf(sample: GreenhouseSample, channel: ChannelId): number | null {
    const raw = sample[channel];
    return typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
}

/**
 * Priority as a single sortable number.
 *
 * Exported because the alarm list, the banner and the summary all have to
 * agree about what "the worst one" means.
 */
export function alarmPriority(level: AlarmLevel, channel: ChannelId): number {
    return (level === 'CRITICAL' ? 0 : 100) + CHANNEL_PRIORITY[channel];
}

/**
 * Conditions true in one sample, most urgent first.
 *
 * A channel can breach both its WARNING and its CRITICAL band at once — 39 °C
 * is above both 30 and 38 — and both are reported, because suppressing the
 * warning would hide the fact that the excursion started as one.
 */
export function evaluateSample(sample: GreenhouseSample): AlarmCondition[] {
    const conditions: AlarmCondition[] = [];

    for (const channel of EVALUATED) {
        const value = valueOf(sample, channel);
        // Null is "not measured", which is not the same as "within limits".
        // cloud/main.py:105 does the same, and it is the only place the
        // Python distinguishes the two.
        if (value === null) continue;

        for (const level of ['CRITICAL', 'WARNING'] as const) {
            const band = LIMITS[level][channel];
            if (!band) continue;

            if (band.high !== null && value > band.high) {
                conditions.push({ channel, level, breach: 'HIGH', value, limit: band.high });
            }
            if (band.low !== null && value < band.low) {
                conditions.push({ channel, level, breach: 'LOW', value, limit: band.low });
            }
        }
    }

    return conditions.sort(
        (a, b) => alarmPriority(a.level, a.channel) - alarmPriority(b.level, b.channel)
    );
}

/** One alarm per channel, level and direction — the episode key. */
function keyOf(farmId: string, condition: Pick<Alarm, 'channel' | 'level' | 'breach'>): string {
    return `${farmId}:${condition.channel}:${condition.level}:${condition.breach}`;
}

/**
 * True while a standing alarm should stay standing.
 *
 * The value has to come back past the limit by the deadband before the alarm
 * returns to normal. Without this a signal sitting on its limit produces one
 * alarm per reading, which is the single most common way an alarm system
 * becomes noise an operator learns to ignore.
 */
function stillBreached(alarm: Alarm, value: number): boolean {
    const deadband = DEADBAND[alarm.channel];
    return alarm.breach === 'HIGH'
        ? value > alarm.limit - deadband
        : value < alarm.limit + deadband;
}

/**
 * Advances the alarm list by one sample.
 *
 * Returns a new list; nothing is mutated. Standing alarms keep their
 * `raisedAt` and their acknowledgement, cleared ones keep a `clearedAt` so the
 * feed can still show what happened, and a channel that re-breaches after
 * clearing starts a new episode with a new id.
 */
export function updateAlarms(
    previous: readonly Alarm[],
    sample: GreenhouseSample,
    now: Millis
): Alarm[] {
    const conditions = evaluateSample(sample);
    const byKey = new Map(conditions.map((condition) => [keyOf(sample.assetId, condition), condition]));
    const next: Alarm[] = [];
    const seen = new Set<string>();

    for (const alarm of previous) {
        const key = keyOf(alarm.farmId, alarm);

        // Alarms already returned to normal are history; carry them through
        // untouched so the operator can still see the episode.
        if (alarm.clearedAt !== null || alarm.farmId !== sample.assetId) {
            next.push(alarm);
            continue;
        }

        seen.add(key);
        const condition = byKey.get(key);
        const value = valueOf(sample, alarm.channel);

        if (condition) {
            next.push({
                ...alarm,
                value: condition.value,
                peak:
                    alarm.breach === 'HIGH'
                        ? Math.max(alarm.peak, condition.value)
                        : Math.min(alarm.peak, condition.value),
            });
            continue;
        }

        if (value !== null && stillBreached(alarm, value)) {
            // Inside the limit but within the deadband: hold, do not chatter.
            next.push({ ...alarm, value });
            continue;
        }

        next.push({ ...alarm, value: value ?? alarm.value, clearedAt: now });
    }

    for (const condition of conditions) {
        const key = keyOf(sample.assetId, condition);
        if (seen.has(key)) continue;

        next.push({
            id: `${key}:${now}`,
            farmId: sample.assetId,
            channel: condition.channel,
            level: condition.level,
            breach: condition.breach,
            value: condition.value,
            peak: condition.value,
            limit: condition.limit,
            raisedAt: now,
            clearedAt: null,
            acknowledgedAt: null,
        });
    }

    return sortAlarms(next);
}

/** Replays a whole series, which is how a freshly loaded window is scored. */
export function replayAlarms(samples: readonly GreenhouseSample[]): Alarm[] {
    return samples.reduce<Alarm[]>(
        (alarms, sample) => updateAlarms(alarms, sample, sample.at),
        []
    );
}

/** Standing alarms first, then by priority, then newest first. */
export function sortAlarms(alarms: readonly Alarm[]): Alarm[] {
    return [...alarms].sort((a, b) => {
        const standing = Number(b.clearedAt === null) - Number(a.clearedAt === null);
        if (standing !== 0) return standing;

        const priority = alarmPriority(a.level, a.channel) - alarmPriority(b.level, b.channel);
        if (priority !== 0) return priority;

        return b.raisedAt - a.raisedAt;
    });
}

/** Marks one alarm acknowledged. Acknowledging twice keeps the first instant. */
export function acknowledgeAlarm(alarms: readonly Alarm[], id: string, at: Millis): Alarm[] {
    return alarms.map((alarm) =>
        alarm.id === id && alarm.acknowledgedAt === null ? { ...alarm, acknowledgedAt: at } : alarm
    );
}

export interface AlarmTally {
    standing: number;
    critical: number;
    warning: number;
    /** Standing and never acknowledged — what the banner counts. */
    unacknowledged: number;
    /** The single most urgent standing alarm, or null. */
    worst: Alarm | null;
}

export function tallyAlarms(alarms: readonly Alarm[]): AlarmTally {
    const standing = alarms.filter((alarm) => alarm.clearedAt === null);
    const sorted = sortAlarms(standing);

    return {
        standing: standing.length,
        critical: standing.filter((alarm) => alarm.level === 'CRITICAL').length,
        warning: standing.filter((alarm) => alarm.level === 'WARNING').length,
        unacknowledged: standing.filter((alarm) => alarm.acknowledgedAt === null).length,
        worst: sorted[0] ?? null,
    };
}

/**
 * The status a single channel is in, for a metric card.
 *
 * Returns `offline` for an unmeasured channel rather than `ok` — the audit's
 * recurring mistake was treating absence as health.
 */
export function channelStatus(channel: ChannelId, value: number | null): Status {
    if (value === null || !Number.isFinite(value)) return 'offline';

    const critical = CRITICAL_LIMITS[channel];
    if (critical && breaches(value, critical)) return 'alert';

    const warning = WARNING_LIMITS[channel];
    if (warning && breaches(value, warning)) return 'warning';

    return 'ok';
}

function breaches(value: number, band: Band): boolean {
    return (
        (band.high !== null && value > band.high) || (band.low !== null && value < band.low)
    );
}

/** The acceptable band a chart draws behind the line, when the channel has one. */
export function comfortBand(channel: ChannelId): { low: number; high: number } | null {
    const band = WARNING_LIMITS[channel] ?? CRITICAL_LIMITS[channel];
    if (!band || band.low === null || band.high === null) return null;

    return { low: band.low, high: band.high };
}
