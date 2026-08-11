import { describe, expect, it } from 'vitest';

import { machineStatus, rank, worst } from './thresholds';
import { findMachine } from './machines';
import { at, reading } from './fixtures';

const lathe = findMachine('MACH-01')!;
const molder = findMachine('INJ-01')!;

describe('rank', () => {
    it('reads higher-is-better metrics from the good end', () => {
        expect(rank(90, 85, 70)).toBe('ok');
        expect(rank(75, 85, 70)).toBe('warning');
        expect(rank(60, 85, 70)).toBe('alert');
    });

    it('reads lower-is-better metrics from the good end too', () => {
        expect(rank(1, 2, 5, false)).toBe('ok');
        expect(rank(4, 2, 5, false)).toBe('warning');
        expect(rank(9, 2, 5, false)).toBe('alert');
    });

    it('treats a legitimate zero as a value, not as missing data', () => {
        // The bug the whole `value || '--'` family of cards had.
        expect(rank(0, 85, 70)).toBe('alert');
        expect(rank(0, 2, 5, false)).toBe('ok');
    });

    it('is offline, not alert, when the number is not a number', () => {
        expect(rank(Number.NaN, 85, 70)).toBe('offline');
        expect(rank(Number.POSITIVE_INFINITY, 2, 5, false)).toBe('offline');
    });
});

describe('worst', () => {
    it('picks the most severe status', () => {
        expect(worst(['ok', 'alert', 'warning'])).toBe('alert');
        expect(worst(['ok', 'warning'])).toBe('warning');
    });

    it('ranks a real status above no signal', () => {
        expect(worst(['offline', 'ok'])).toBe('ok');
    });

    it('is offline when there is nothing to rank', () => {
        expect(worst([])).toBe('offline');
    });
});

describe('machineStatus', () => {
    const now = at(2026, 4, 6, 10);

    it('judges each machine against its own limits', () => {
        const hot = reading({ at: now, temperature: 195 });

        // 195 °C is a fault on a lathe and a normal barrel on a moulder.
        expect(machineStatus(hot, lathe)).toBe('alert');
        expect(machineStatus({ ...hot, assetId: molder.id }, molder)).toBe('ok');
    });

    it('reports a stopped machine as offline rather than perfect', () => {
        const stopped = reading({ at: now, speed: 0, temperature: 20, vibration: 0 });

        expect(machineStatus(stopped, lathe)).toBe('offline');
    });

    it('takes the worst of temperature, vibration and power', () => {
        const shaking = reading({ at: now, temperature: 40, vibration: 7.5, power: 3000 });

        expect(machineStatus(shaking, lathe)).toBe('alert');
    });

    it('warns before the limit rather than only at it', () => {
        // 5.5 mm/s against a 7.1 limit: past 70% of it.
        const drifting = reading({ at: now, temperature: 40, vibration: 5.5, power: 3000 });

        expect(machineStatus(drifting, lathe)).toBe('warning');
    });
});
