import type { Alert, Millis, PersonalReading } from '@cognitex/data';

import { BODY_TEMPERATURE_LIMIT, heartRateReserve } from './fatigue';
import { formatDuration } from './shift';
import { findWorker } from './workers';
import type { ManDownEpisode, Worker } from './types';

/**
 * Man-down and the alarms around it.
 *
 * `PersonalReading.manDown` is a boolean: true means the wearable detected a
 * fall. That sentence is the whole fix. The previous encoding was a 0/1 in the
 * `co2` slot written as `co2: isWorking ? 1 : 0` — with a comment in the
 * generator admitting the polarity was inverted "for simplicity" — while the
 * dashboard rendered `stats.co2 === 1 ? 'ALERTA' : 'OK'`. The producer meant
 * "working", the consumer read "fallen", and so every worked hour in the
 * history view displayed a man-down alarm while every idle hour displayed OK.
 *
 * An episode is a continuous run of `manDown: true`, closed at the first
 * reading that reports false.
 */

export function manDownEpisodes(readings: readonly PersonalReading[]): ManDownEpisode[] {
    const byAsset = new Map<string, PersonalReading[]>();
    for (const reading of readings) {
        const list = byAsset.get(reading.assetId) ?? [];
        list.push(reading);
        byAsset.set(reading.assetId, list);
    }

    const episodes: ManDownEpisode[] = [];

    for (const [assetId, own] of byAsset) {
        own.sort((a, b) => a.at - b.at);

        let openedAt: Millis | null = null;
        let lastAt: Millis | null = null;

        for (const reading of own) {
            if (reading.manDown) {
                if (openedAt === null) openedAt = reading.at;
            } else if (openedAt !== null) {
                episodes.push({
                    assetId,
                    from: openedAt,
                    to: reading.at,
                    durationMs: reading.at - openedAt,
                    resolved: true,
                });
                openedAt = null;
            }
            lastAt = reading.at;
        }

        if (openedAt !== null && lastAt !== null) {
            episodes.push({
                assetId,
                from: openedAt,
                to: lastAt,
                durationMs: Math.max(0, lastAt - openedAt),
                resolved: false,
            });
        }
    }

    return episodes.sort((a, b) => b.from - a.from);
}

/** Episodes still open, which is the only thing worth interrupting someone for. */
export function openManDown(episodes: readonly ManDownEpisode[]): ManDownEpisode[] {
    return episodes.filter((episode) => !episode.resolved);
}

/**
 * Alarms derived from telemetry, in the shared `Alert` shape.
 *
 * Only used when the console runs on generated data. With Firestore
 * configured the alerts come from the collection the ingestion pipeline
 * writes, so two supervisors looking at the same crew see the same list.
 *
 * Ids are deterministic — asset, instant and kind — so re-deriving from the
 * same readings does not produce a second copy of every alarm.
 */
export function deriveAlerts(
    readings: readonly PersonalReading[],
    orgId: string,
    max = 40
): Alert[] {
    const alerts: Alert[] = [];

    for (const episode of manDownEpisodes(readings)) {
        const worker = findWorker(episode.assetId);
        alerts.push({
            id: `${episode.assetId}-${episode.from}-mandown`,
            orgId,
            assetId: episode.assetId,
            at: episode.from,
            status: 'alert',
            message: episode.resolved
                ? `${label(worker)}: hombre caído, ${formatDuration(episode.durationMs)} hasta la recuperación`
                : `${label(worker)}: hombre caído, alarma sin resolver`,
            acknowledgedAt: null,
        });
    }

    for (const reading of readings) {
        const worker = findWorker(reading.assetId);
        if (!worker) continue;

        if (reading.bodyTemperature >= BODY_TEMPERATURE_LIMIT) {
            alerts.push({
                id: `${reading.assetId}-${reading.at}-heat`,
                orgId,
                assetId: reading.assetId,
                at: reading.at,
                status: 'alert',
                message: `${worker.name}: temperatura corporal ${reading.bodyTemperature.toFixed(1)} °C (límite ${BODY_TEMPERATURE_LIMIT} °C)`,
                acknowledgedAt: null,
            });
        }

        const reserve = heartRateReserve(reading.heartRate, worker);
        if (reserve >= 90) {
            alerts.push({
                id: `${reading.assetId}-${reading.at}-hr`,
                orgId,
                assetId: reading.assetId,
                at: reading.at,
                status: 'warning',
                message: `${worker.name}: ${Math.round(reading.heartRate)} bpm, ${reserve.toFixed(0)}% de su reserva cardíaca`,
                acknowledgedAt: null,
            });
        }

        if (reading.wearableBattery <= 10) {
            alerts.push({
                id: `${reading.assetId}-${reading.at}-battery`,
                orgId,
                assetId: reading.assetId,
                at: reading.at,
                status: 'warning',
                message: `${worker.name}: batería del casco al ${Math.round(reading.wearableBattery)}%, la detección de caída se perderá`,
                acknowledgedAt: null,
            });
        }
    }

    return alerts.sort((a, b) => b.at - a.at).slice(0, max);
}

/** Unacknowledged alarms in the last `windowMs`, newest first. */
export function activeAlerts(
    alerts: readonly Alert[],
    options: { now: Millis; windowMs: number }
): Alert[] {
    const earliest = options.now - options.windowMs;
    return alerts
        .filter((alert) => alert.acknowledgedAt === null && alert.at >= earliest)
        .sort((a, b) => b.at - a.at);
}

function label(worker: Worker | null): string {
    return worker?.name ?? 'Trabajador desconocido';
}
