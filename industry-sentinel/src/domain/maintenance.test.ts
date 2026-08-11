import { describe, expect, it } from 'vitest';

import {
    forecastMaintenance,
    maintenanceQueue,
    vibrationTrend,
    vibrationZone,
} from './maintenance';
import { MACHINES, findMachine } from './machines';
import { at, hourly, reading } from './fixtures';

const lathe = findMachine('MACH-01')!;
const robot = findMachine('ROBO-01')!;

describe('vibrationTrend', () => {
    it('measures the rise per day, not per sample', () => {
        // +0.1 mm/s every hour → 2.4 mm/s per day.
        const readings = hourly(at(2026, 4, 6, 8), 5, (index) => ({
            vibration: 1 + index * 0.1,
        }));

        const trend = vibrationTrend(readings)!;

        expect(trend.samples).toBe(5);
        expect(trend.slopePerDay).toBeCloseTo(2.4, 6);
        expect(trend.latest).toBeCloseTo(1.4, 6);
        expect(trend.fittedLatest).toBeCloseTo(1.4, 6);
    });

    it('ignores stopped samples, where vibration measures nothing', () => {
        const readings = hourly(at(2026, 4, 6, 8), 6, (index) =>
            index % 2 === 0 ? { speed: 0, vibration: 0.05 } : { vibration: 3 }
        );

        const trend = vibrationTrend(readings)!;

        expect(trend.samples).toBe(3);
        expect(trend.mean).toBeCloseTo(3, 6);
        expect(trend.slopePerDay).toBeCloseTo(0, 6);
    });

    it('has no trend from a single running sample', () => {
        expect(vibrationTrend([reading({ at: at(2026, 4, 6, 8) })])).toBeNull();
        expect(vibrationTrend([])).toBeNull();
    });

    it('reports a falling trend as negative rather than clamping it', () => {
        const readings = hourly(at(2026, 4, 6, 8), 4, (index) => ({
            vibration: 4 - index * 0.2,
        }));

        expect(vibrationTrend(readings)!.slopePerDay).toBeLessThan(0);
    });
});

describe('vibrationZone', () => {
    it('scales the zones to each machine own limit', () => {
        // The lathe alarms at 7.1 mm/s, the robot arm at 2.8.
        expect(vibrationZone(1.4, lathe)).toBe('A');
        expect(vibrationZone(3, lathe)).toBe('B');
        expect(vibrationZone(5, lathe)).toBe('C');
        expect(vibrationZone(7.5, lathe)).toBe('D');

        // The same 3 mm/s is already unsatisfactory on the robot — the reading
        // a single hardcoded `vpd > 6` threshold called healthy.
        expect(vibrationZone(3, robot)).toBe('D');
    });
});

describe('forecastMaintenance', () => {
    const now = at(2026, 4, 6, 13);

    it('projects the hours left before the alarm limit', () => {
        const readings = hourly(at(2026, 4, 6, 8), 5, (index) => ({
            vibration: 1 + index * 0.1,
        }));

        const forecast = forecastMaintenance(lathe, readings, now)!;

        // 7.1 - 1.4 = 5.7 mm/s of headroom at 2.4 mm/s per day.
        expect(forecast.hoursToAlarm).toBeCloseTo(57, 4);
        expect(forecast.alarmAt).toBeCloseTo(now + 57 * 3_600_000, -2);
        expect(forecast.zone).toBe('A');
        expect(forecast.status).toBe('ok');
    });

    it('refuses to forecast a machine that is not degrading', () => {
        const readings = hourly(at(2026, 4, 6, 8), 5, (index) => ({
            vibration: 3 - index * 0.05,
        }));

        const forecast = forecastMaintenance(lathe, readings, now)!;

        // No horizon at all, rather than a comfortably large one.
        expect(forecast.hoursToAlarm).toBeNull();
        expect(forecast.alarmAt).toBeNull();
    });

    it('reports zero hours once the limit has already been passed', () => {
        const readings = hourly(at(2026, 4, 6, 8), 4, (index) => ({
            vibration: 7.5 + index * 0.1,
        }));

        const forecast = forecastMaintenance(lathe, readings, now)!;

        expect(forecast.hoursToAlarm).toBe(0);
        expect(forecast.zone).toBe('D');
        expect(forecast.status).toBe('alert');
    });

    it('returns nothing when the machine has not reported', () => {
        expect(forecastMaintenance(lathe, [], now)).toBeNull();
    });

    it('only reads its own machine readings', () => {
        const readings = [
            ...hourly(at(2026, 4, 6, 8), 4, (index) => ({ vibration: 1 + index * 0.1 })),
            ...hourly(at(2026, 4, 6, 8), 4, () => ({ assetId: robot.id, vibration: 9 })),
        ];

        expect(forecastMaintenance(lathe, readings, now)!.trend.samples).toBe(4);
    });
});

describe('maintenanceQueue', () => {
    const now = at(2026, 4, 6, 13);

    it('puts the machine that reaches its limit soonest at the top', () => {
        const readings = [
            // Lathe: slow rise, far from its 7.1 limit.
            ...hourly(at(2026, 4, 6, 8), 5, (index) => ({ vibration: 1 + index * 0.02 })),
            // Robot: fast rise, close to its 2.8 limit.
            ...hourly(at(2026, 4, 6, 8), 5, (index) => ({
                assetId: robot.id,
                vibration: 2 + index * 0.1,
            })),
        ];

        const queue = maintenanceQueue(MACHINES, readings, now);

        expect(queue[0]?.machine.id).toBe(robot.id);
        expect(queue[1]?.machine.id).toBe(lathe.id);
    });

    it('sorts machines with no horizon last instead of dropping them', () => {
        const readings = [
            // Stable: no forecast.
            ...hourly(at(2026, 4, 6, 8), 4, () => ({ vibration: 1 })),
            // Degrading.
            ...hourly(at(2026, 4, 6, 8), 4, (index) => ({
                assetId: robot.id,
                vibration: 2 + index * 0.1,
            })),
        ];

        const queue = maintenanceQueue(MACHINES, readings, now);

        expect(queue).toHaveLength(2);
        expect(queue[0]?.machine.id).toBe(robot.id);
        expect(queue[1]?.hoursToAlarm).toBeNull();
    });

    it('is empty when nothing has reported', () => {
        expect(maintenanceQueue(MACHINES, [], now)).toEqual([]);
    });
});
