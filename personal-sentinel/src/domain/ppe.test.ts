import { describe, expect, it } from 'vitest';

import { crewCoverage, ppeCompliance, ppeStatuses, wearableCoverage } from './ppe';
import { HOUR_MS } from './shift';
import { WORKERS, findWorker } from './workers';
import { at, reading } from './fixtures';

const welder = findWorker('WRK-001')!;
const chemist = findWorker('WRK-004')!;

describe('wearableCoverage', () => {
    const now = at(2026, 4, 6, 12);

    it('reads the most recent helmet report', () => {
        const coverage = wearableCoverage(
            [
                reading({ at: now - 5 * HOUR_MS, wearableBattery: 90 }),
                reading({ at: now - HOUR_MS, wearableBattery: 62 }),
            ],
            welder,
            now
        );

        expect(coverage.lastSeen).toBe(now - HOUR_MS);
        expect(coverage.battery).toBe(62);
        expect(coverage.stale).toBe(false);
        expect(coverage.status).toBe('ok');
    });

    it('is offline when the helmet has gone quiet, whatever its last battery said', () => {
        const coverage = wearableCoverage(
            [reading({ at: now - 6 * HOUR_MS, wearableBattery: 100 })],
            welder,
            now
        );

        expect(coverage.stale).toBe(true);
        // A full battery does not make a helmet that stopped reporting fine.
        expect(coverage.status).toBe('offline');
    });

    it('is offline, with no battery figure, for a worker who never reported', () => {
        const coverage = wearableCoverage([], welder, now);

        expect(coverage.lastSeen).toBeNull();
        expect(coverage.battery).toBeNull();
        expect(coverage.status).toBe('offline');
    });

    it('warns on a battery that will take fall detection with it', () => {
        const coverage = wearableCoverage(
            [reading({ at: now, wearableBattery: 18 })],
            welder,
            now
        );

        expect(coverage.status).toBe('warning');
    });

    it('reads only its own worker readings', () => {
        const coverage = wearableCoverage(
            [reading({ at: now, assetId: chemist.id, wearableBattery: 12 })],
            welder,
            now
        );

        expect(coverage.lastSeen).toBeNull();
    });
});

describe('ppeStatuses', () => {
    const now = at(2026, 4, 6, 12);

    it('verifies the instrumented item and refuses to claim the rest', () => {
        const coverage = wearableCoverage([reading({ at: now })], welder, now);
        const statuses = ppeStatuses(welder, coverage);

        expect(statuses).toHaveLength(welder.requiredPpe.length);

        const helmet = statuses.find((status) => status.item === 'casco');
        expect(helmet?.verification).toBe('wearable');
        expect(helmet?.compliant).toBe(true);

        // Everything else is null, not false: the platform has no sensor for
        // it, and a red cross would be as much a fabrication as a green tick.
        const gloves = statuses.find((status) => status.item === 'guantes');
        expect(gloves?.verification).toBe('declarado');
        expect(gloves?.compliant).toBeNull();
    });

    it('fails the helmet when it has stopped reporting', () => {
        const coverage = wearableCoverage(
            [reading({ at: now - 6 * HOUR_MS })],
            welder,
            now
        );

        expect(ppeStatuses(welder, coverage).find((s) => s.item === 'casco')?.compliant).toBe(
            false
        );
    });

    it('says unknown, not failed, when the helmet has never reported at all', () => {
        const coverage = wearableCoverage([], welder, now);

        expect(
            ppeStatuses(welder, coverage).find((s) => s.item === 'casco')?.compliant
        ).toBeNull();
    });
});

describe('ppeCompliance', () => {
    const now = at(2026, 4, 6, 12);

    it('rates only what it can check, and says how much that was', () => {
        const coverage = wearableCoverage([reading({ at: now })], welder, now);
        const result = ppeCompliance(ppeStatuses(welder, coverage));

        expect(result.required).toBe(6);
        expect(result.verifiable).toBe(1);
        expect(result.compliant).toBe(1);
        expect(result.rate).toBe(100);
    });

    it('has no rate at all when nothing could be verified', () => {
        const result = ppeCompliance(ppeStatuses(welder, wearableCoverage([], welder, now)));

        // Null, not 100. "Nothing failed" and "nothing was checked" are
        // different claims, and only one belongs in a compliance report.
        expect(result.rate).toBeNull();
        expect(result.verifiable).toBe(0);
    });

    it('reports a real zero when the one verifiable item failed', () => {
        const coverage = wearableCoverage([reading({ at: now - 9 * HOUR_MS })], welder, now);
        const result = ppeCompliance(ppeStatuses(welder, coverage));

        expect(result.rate).toBe(0);
        expect(result.verifiable).toBe(1);
    });
});

describe('crewCoverage', () => {
    const now = at(2026, 4, 6, 12);

    it('counts the helmets actually reporting, out of the whole crew', () => {
        const readings = [
            reading({ at: now, assetId: 'WRK-001' }),
            reading({ at: now, assetId: 'WRK-002' }),
            reading({ at: now - 9 * HOUR_MS, assetId: 'WRK-003' }),
        ];

        const result = crewCoverage(readings, WORKERS, now);

        expect(result.total).toBe(5);
        expect(result.covered).toBe(2);
        expect(result.rate).toBe(40);
    });

    it('is zero, not empty, when nobody is reporting', () => {
        expect(crewCoverage([], WORKERS, now).rate).toBe(0);
    });
});
