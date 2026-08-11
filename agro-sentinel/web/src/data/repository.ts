import { fetchAlerts, fetchReadings, isConfigured } from '@cognitex/data';
import type { Alert, DataSource, Reading } from '@cognitex/data';

import { findChannel, replayAlarms } from '../domain';
import type { Alarm, Farm, GreenhouseSample, Millis, ThermalScan } from '../domain';
import { generateSamples, generateScans } from './generate';
import { acknowledgeAlert, fetchLiveState, fetchThermalScans } from './store';

/**
 * The console's only data entry point.
 *
 * Two rules, both from `@cognitex/data`'s repository:
 *
 *  1. Firestore when it is configured, the generator otherwise.
 *  2. **The answer always says which one it was.** Every snapshot carries a
 *     `source`, so each view renders `<DataSourceBadge>` and the grower knows
 *     whether they are looking at their greenhouse or at a demonstration. The
 *     old console generated 200 days of readings in the browser and drew them
 *     as measurement; the only hint was a "MODO SIMULACIÓN" caption at 8px in
 *     the sidebar footer, at 40% opacity.
 */

export interface Snapshot {
    samples: GreenhouseSample[];
    /** Operational feed: persisted when configured, derived otherwise. */
    alerts: Alert[];
    /** Computed here from the window, by the ISA-18.2 evaluator. */
    alarms: Alarm[];
    scans: ThermalScan[];
    source: DataSource;
    /** When the store answered. Null in generated mode. */
    updatedAt: Millis | null;
}

export interface LoadOptions {
    orgId: string;
    farm: Farm;
    /** Window length in hours. */
    hours: number;
    now: Millis;
}

/** One reading every five minutes is what a LoRa gateway typically reports. */
const STEP_MINUTES = 5;
/** Firestore page size. 30 days at five minutes is 8 640 rows. */
const MAX_READINGS = 3000;

function isAgro(reading: Reading): reading is Extract<Reading, { platform: 'agro' }> {
    return reading.platform === 'agro';
}

/**
 * Widens a shared `AgroReading` into this console's sample.
 *
 * Device health is null rather than zero: a reading that came through the
 * shared collection carries no battery figure, and a battery shown as 0%
 * would raise a critical alarm for a node that is fine.
 */
function toSample(reading: Extract<Reading, { platform: 'agro' }>): GreenhouseSample {
    return {
        ...reading,
        batteryPct: null,
        rssiDbm: null,
        soilEc: null,
        soilTemperature: null,
    };
}

export async function loadSnapshot(options: LoadOptions): Promise<Snapshot> {
    const since = options.now - options.hours * 3_600_000;

    if (!isConfigured()) {
        const samples = generateSamples({
            farm: options.farm,
            orgId: options.orgId,
            hours: options.hours,
            stepMinutes: STEP_MINUTES,
            now: options.now,
        });
        const alarms = replayAlarms(samples);

        return {
            samples,
            alarms,
            alerts: alarms.map(toAlert),
            scans: generateScans({ farm: options.farm, samples, now: options.now }),
            source: 'generated',
            updatedAt: null,
        };
    }

    // Everything the store can answer at once. A thermal subcollection that
    // does not exist yet resolves to an empty array rather than failing the
    // whole load — the climate view must still open.
    const [readings, alerts, live, scans] = await Promise.all([
        fetchReadings({
            orgId: options.orgId,
            assetId: options.farm.id,
            since,
            max: MAX_READINGS,
        }),
        fetchAlerts({ orgId: options.orgId, max: 100 }),
        fetchLiveState({ orgId: options.orgId, farmId: options.farm.id }).catch(() => null),
        fetchThermalScans({ orgId: options.orgId, farmId: options.farm.id }).catch(
            () => [] as ThermalScan[]
        ),
    ]);

    const samples = (readings?.items ?? []).filter(isAgro).map(toSample);

    // The live-state document is newer than the last stored reading whenever
    // the pipeline writes `greenhouses` but not `readings` — which is exactly
    // what it does today. Appending it means the current-conditions panel has
    // something true to show even with an empty history.
    if (live && Number.isFinite(live.airTemperature)) {
        const newest = samples.at(-1);
        if (!newest || live.at > newest.at) samples.push(live);
    }

    return {
        samples,
        alarms: replayAlarms(samples),
        alerts: (alerts?.items ?? []).filter((alert) => alert.assetId === options.farm.id),
        scans,
        source: 'store',
        updatedAt: Date.now(),
    };
}

/**
 * Turns a computed alarm into the shared `Alert` shape.
 *
 * Used only in generated mode, so the demo's feed and a real deployment's
 * feed are the same component fed the same type. The shared shape exists
 * because the REST API used to emit `{time, priority}` while the client
 * generator emitted `{timestamp, severity}` — the ticker rendered a blank
 * time and the critical filter matched nothing.
 */
export function toAlert(alarm: Alarm): Alert {
    const channel = findChannel(alarm.channel);
    const direction = alarm.breach === 'HIGH' ? 'sobre' : 'bajo';

    return {
        id: alarm.id,
        orgId: 'demo',
        assetId: alarm.farmId,
        at: alarm.raisedAt,
        status: alarm.level === 'CRITICAL' ? 'alert' : 'warning',
        message: `${channel.label} ${direction} el límite: ${alarm.peak.toFixed(
            channel.precision
        )} ${channel.unit} (límite ${alarm.limit} ${channel.unit})`,
        acknowledgedAt: alarm.acknowledgedAt,
    };
}

/**
 * Acknowledges an alert, in whichever mode the console is running.
 *
 * Returns the updated alert either way, and says whether it reached the
 * store — the caller renders the difference rather than assuming a write
 * happened. Nothing here pretends a demo click was persisted.
 */
export async function acknowledge(
    alert: Alert,
    at: Millis
): Promise<{ value: Alert; source: DataSource }> {
    const value: Alert = { ...alert, acknowledgedAt: at };

    if (!isConfigured()) return { value, source: 'generated' };

    await acknowledgeAlert(alert.id, at);
    return { value, source: 'store' };
}
