import { describe, expect, it } from 'vitest';

import { activeAlerts, deriveAlerts, manDownEpisodes, openManDown } from './safety';
import { HOUR_MS } from './shift';
import { WORK_SHIFT } from './workers';
import { isOnShift } from './shift';
import { at, hourly, reading } from './fixtures';

/**
 * The regression suite for the live defect.
 *
 * The generator wrote `co2: isWorking ? 1 : 0` and the dashboard read
 * `stats.co2 === 1 ? 'ALERTA' : 'OK'`, so history mode reported a man-down
 * alarm for every worked hour and reported OK for every hour the worker was
 * off shift. These tests fail if that polarity ever comes back.
 */
describe('manDownEpisodes — the inverted-polarity defect', () => {
    it('reports nothing for a full worked shift where nobody fell', () => {
        // 08:00 to 16:00, on shift throughout, manDown false throughout.
        const shift = hourly(at(2026, 4, 6, 8), 9);

        expect(shift.every((entry) => isOnShift(entry.at, WORK_SHIFT))).toBe(true);
        // The old encoding produced nine alarms here, one per worked hour.
        expect(manDownEpisodes(shift)).toEqual([]);
    });

    it('reports nothing for hours off shift either', () => {
        const night = hourly(at(2026, 4, 6, 22), 6);

        expect(manDownEpisodes(night)).toEqual([]);
    });

    it('reports a fall, and only the fall', () => {
        const shift = hourly(at(2026, 4, 6, 8), 9, (index) =>
            index === 3 ? { manDown: true } : {}
        );

        const [episode, ...rest] = manDownEpisodes(shift);

        expect(rest).toHaveLength(0);
        expect(episode?.from).toBe(at(2026, 4, 6, 11));
        expect(episode?.to).toBe(at(2026, 4, 6, 12));
        expect(episode?.durationMs).toBe(HOUR_MS);
        expect(episode?.resolved).toBe(true);
    });
});

describe('manDownEpisodes', () => {
    it('merges consecutive alarm samples into one episode', () => {
        const readings = hourly(at(2026, 4, 6, 8), 8, (index) =>
            index >= 2 && index <= 4 ? { manDown: true } : {}
        );

        const [episode] = manDownEpisodes(readings);

        expect(manDownEpisodes(readings)).toHaveLength(1);
        expect(episode?.durationMs).toBe(3 * HOUR_MS);
    });

    it('keeps two workers apart', () => {
        const readings = [
            ...hourly(at(2026, 4, 6, 8), 4, (index) => (index === 1 ? { manDown: true } : {})),
            ...hourly(at(2026, 4, 6, 8), 4, (index) => ({
                assetId: 'WRK-004',
                ...(index === 1 ? { manDown: true } : {}),
            })),
        ];

        const episodes = manDownEpisodes(readings);

        expect(episodes).toHaveLength(2);
        expect(new Set(episodes.map((episode) => episode.assetId))).toEqual(
            new Set(['WRK-001', 'WRK-004'])
        );
    });

    it('marks an alarm still raised at the end of the feed as unresolved', () => {
        const readings = hourly(at(2026, 4, 6, 8), 4, (index) =>
            index >= 2 ? { manDown: true } : {}
        );

        const [episode] = manDownEpisodes(readings);

        expect(episode?.resolved).toBe(false);
        expect(openManDown(manDownEpisodes(readings))).toHaveLength(1);
    });

    it('sorts unordered readings before scanning them', () => {
        const ordered = hourly(at(2026, 4, 6, 8), 5, (index) =>
            index === 2 ? { manDown: true } : {}
        );
        const shuffled = [ordered[3]!, ordered[0]!, ordered[4]!, ordered[1]!, ordered[2]!];

        expect(manDownEpisodes(shuffled)).toEqual(manDownEpisodes(ordered));
    });

    it('is empty rather than undefined on an empty feed', () => {
        expect(manDownEpisodes([])).toEqual([]);
    });
});

describe('deriveAlerts', () => {
    it('raises a man-down alarm at alert severity', () => {
        const alerts = deriveAlerts(
            hourly(at(2026, 4, 6, 8), 4, (index) => (index === 1 ? { manDown: true } : {})),
            'org-1'
        );

        const manDown = alerts.find((alert) => alert.message.includes('hombre caído'));

        expect(manDown?.status).toBe('alert');
        expect(manDown?.at).toBe(at(2026, 4, 6, 9));
        expect(manDown?.acknowledgedAt).toBeNull();
    });

    it('judges heart rate against the worker own reserve, not a fixed number', () => {
        // 175 bpm: 96% of reserve for a 46-year-old resting at 68.
        const alerts = deriveAlerts([reading({ at: at(2026, 4, 6, 9), heartRate: 175 })], 'org-1');

        expect(alerts.some((alert) => alert.message.includes('reserva cardíaca'))).toBe(true);
    });

    it('says nothing about a heart rate that is high but within reserve', () => {
        const alerts = deriveAlerts([reading({ at: at(2026, 4, 6, 9), heartRate: 125 })], 'org-1');

        expect(alerts).toEqual([]);
    });

    it('warns when the helmet battery is about to take fall detection with it', () => {
        const alerts = deriveAlerts(
            [reading({ at: at(2026, 4, 6, 9), wearableBattery: 6 })],
            'org-1'
        );

        expect(alerts[0]?.status).toBe('warning');
        expect(alerts[0]?.message).toContain('detección de caída');
    });

    it('gives the same event the same id twice, so re-deriving does not duplicate', () => {
        const readings = [reading({ at: at(2026, 4, 6, 9), bodyTemperature: 39 })];

        expect(deriveAlerts(readings, 'org-1')[0]?.id).toBe(
            deriveAlerts(readings, 'org-1')[0]?.id
        );
    });

    it('ignores an asset the crew list does not know', () => {
        const alerts = deriveAlerts(
            [reading({ at: at(2026, 4, 6, 9), assetId: 'WRK-999', bodyTemperature: 40 })],
            'org-1'
        );

        // The man-down scan still runs on unknown assets; nothing else does.
        expect(alerts).toEqual([]);
    });
});

describe('activeAlerts', () => {
    const now = at(2026, 4, 6, 12);

    it('drops acknowledged alarms and anything outside the window', () => {
        const alerts = deriveAlerts(
            [
                reading({ at: now - HOUR_MS, bodyTemperature: 39 }),
                reading({ at: now - 40 * HOUR_MS, bodyTemperature: 39 }),
            ],
            'org-1'
        );
        const withAck = [...alerts, { ...alerts[0]!, id: 'ack', acknowledgedAt: now }];

        const active = activeAlerts(withAck, { now, windowMs: 24 * HOUR_MS });

        expect(active).toHaveLength(1);
        expect(active[0]?.at).toBe(now - HOUR_MS);
    });
});
