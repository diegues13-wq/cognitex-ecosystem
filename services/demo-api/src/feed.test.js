import { describe, expect, it, vi } from 'vitest';
import { FRESHNESS_WINDOW_MS, buildPayload, dayKey } from './feed.js';

/**
 * The `source` field is the whole point of this service. The landing page
 * claims to show real measurements; if this ever labels synthetic data as
 * "live", the site starts lying about the one thing it sells.
 */

const NOW = Date.UTC(2026, 7, 10, 15, 0, 0);

const freshSeries = [
    { at: NOW - 60_000 * 60, kw: 3.2 },
    { at: NOW - 60_000 * 30, kw: 4.1 },
    { at: NOW - 60_000, kw: 4.7 },
];

const freshVehicle = { kmToday: 38, litersPer100km: 9.4, stops: 6, at: NOW - 120_000 };

const deps = (over = {}) => ({
    storeAvailable: true,
    readOfficeSeries: async () => freshSeries,
    readVehicleDay: async () => freshVehicle,
    now: NOW,
    ...over,
});

describe('buildPayload — provenance', () => {
    it('marks both feeds live when devices reported recently', async () => {
        const payload = await buildPayload(deps());

        expect(payload.office.source).toBe('live');
        expect(payload.vehicle.source).toBe('live');
        expect(payload.office.currentKw).toBe(4.7);
        expect(payload.vehicle.kmToday).toBe(38);
    });

    it('marks the office simulated when its last reading is stale', async () => {
        const stale = [{ at: NOW - FRESHNESS_WINDOW_MS - 1000, kw: 4.7 }];
        const payload = await buildPayload(deps({ readOfficeSeries: async () => stale }));

        expect(payload.office.source).toBe('simulated');
        // And it must not pass the stale reading off as the current value.
        expect(payload.office.series).not.toEqual(stale);
    });

    it('marks each feed independently — one device down does not fake the other', async () => {
        const payload = await buildPayload(deps({ readVehicleDay: async () => null }));

        expect(payload.office.source).toBe('live');
        expect(payload.vehicle.source).toBe('simulated');
    });

    it('never reports live when the store is unavailable', async () => {
        const payload = await buildPayload(deps({ storeAvailable: false }));

        expect(payload.office.source).toBe('simulated');
        expect(payload.vehicle.source).toBe('simulated');
    });

    it('never reports live when there is no data at all', async () => {
        const payload = await buildPayload(
            deps({ readOfficeSeries: async () => [], readVehicleDay: async () => null })
        );

        expect(payload.office.source).toBe('simulated');
        expect(payload.vehicle.source).toBe('simulated');
    });

    it('falls back to simulated — not an error — when Firestore throws', async () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const payload = await buildPayload(
            deps({
                readOfficeSeries: async () => {
                    throw new Error('deadline exceeded');
                },
            })
        );

        expect(payload.office.source).toBe('simulated');
        expect(payload.vehicle.source).toBe('simulated');
        spy.mockRestore();
    });

    it('treats a reading exactly at the freshness boundary as stale', async () => {
        const boundary = [{ at: NOW - FRESHNESS_WINDOW_MS, kw: 4.7 }];
        const payload = await buildPayload(deps({ readOfficeSeries: async () => boundary }));

        expect(payload.office.source).toBe('simulated');
    });
});

describe('buildPayload — shape', () => {
    it('always returns a usable series, live or not', async () => {
        for (const available of [true, false]) {
            const payload = await buildPayload(deps({ storeAvailable: available }));

            expect(Array.isArray(payload.office.series)).toBe(true);
            expect(payload.office.series.length).toBeGreaterThan(0);
            expect(typeof payload.office.currentKw).toBe('number');
            expect(Number.isFinite(payload.vehicle.kmToday)).toBe(true);
        }
    });

    it('stamps updatedAt as an ISO instant', async () => {
        const payload = await buildPayload(deps());

        expect(payload.updatedAt).toBe(new Date(NOW).toISOString());
    });
});

describe('dayKey', () => {
    it('keys by calendar date so one document covers a day', () => {
        expect(dayKey(new Date(Date.UTC(2026, 7, 10, 23, 59)))).toBe('2026-08-10');
        expect(dayKey(new Date(Date.UTC(2026, 7, 11, 0, 1)))).toBe('2026-08-11');
    });
});
