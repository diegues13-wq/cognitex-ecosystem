import { describe, expect, it } from 'vitest';

import {
    acknowledgeAlarm,
    alarmPriority,
    channelStatus,
    comfortBand,
    evaluateSample,
    replayAlarms,
    tallyAlarms,
    updateAlarms,
} from './alarms';
import { at, sample, series } from './fixtures';
import type { Alarm } from './types';

describe('evaluateSample', () => {
    it('finds nothing wrong with a nominal greenhouse', () => {
        expect(evaluateSample(sample())).toEqual([]);
    });

    it('raises the CRITICAL and the WARNING when a value clears both limits', () => {
        // cloud/main.py: temperature WARNING above 30, CRITICAL above 38.
        const conditions = evaluateSample(sample({ airTemperature: 39 }));

        expect(conditions).toHaveLength(2);
        expect(conditions[0]).toMatchObject({ level: 'CRITICAL', breach: 'HIGH', limit: 38 });
        expect(conditions[1]).toMatchObject({ level: 'WARNING', breach: 'HIGH', limit: 30 });
    });

    it('distinguishes a low breach from a high one', () => {
        const cold = evaluateSample(sample({ airTemperature: 8 }));

        expect(cold[0]).toMatchObject({ level: 'CRITICAL', breach: 'LOW', limit: 10, value: 8 });
    });

    it('ignores a channel with no limit at that level', () => {
        // Battery has a CRITICAL minimum and no WARNING band at all.
        const conditions = evaluateSample(sample({ batteryPct: 10 }));

        expect(conditions).toHaveLength(1);
        expect(conditions[0]).toMatchObject({ channel: 'batteryPct', level: 'CRITICAL' });
    });

    it('treats an unmeasured channel as unmeasured, not as healthy', () => {
        // A reading that arrived through the shared `readings` collection has
        // no battery figure. That must not read as "battery fine".
        expect(evaluateSample(sample({ batteryPct: null }))).toEqual([]);
    });

    it('alarms on a real zero instead of discarding it', () => {
        // The mirror of cloud/main.py:181's `if temp and humidity`: 0 is a
        // measurement. PAR is legitimately 0 at night, so use CO2, where zero
        // means the sensor is lying and someone should look.
        const conditions = evaluateSample(sample({ co2: 0 }));

        expect(conditions.some((c) => c.channel === 'co2' && c.level === 'CRITICAL')).toBe(true);
    });

    it('orders by level first and by what the crop loses second', () => {
        const conditions = evaluateSample(sample({ rssiDbm: -95, soilMoisture: 10 }));

        // A lost radio link is critical, but a dry root zone is the one that
        // kills the crop — and both come before any warning.
        expect(conditions.map((c) => `${c.level}:${c.channel}`)).toEqual([
            'CRITICAL:soilMoisture',
            'CRITICAL:rssiDbm',
            'WARNING:soilMoisture',
        ]);
    });
});

describe('alarmPriority', () => {
    it('puts every critical alarm above every warning', () => {
        expect(alarmPriority('CRITICAL', 'rssiDbm')).toBeLessThan(
            alarmPriority('WARNING', 'airTemperature')
        );
    });
});

describe('updateAlarms', () => {
    it('raises an alarm once and keeps its raisedAt across samples', () => {
        const first = updateAlarms([], sample({ airTemperature: 39 }), at(0));
        const second = updateAlarms(first, sample({ airTemperature: 40, at: at(1) }), at(1));

        expect(second.filter((alarm) => alarm.channel === 'airTemperature')).toHaveLength(2);
        const critical = second.find((alarm) => alarm.level === 'CRITICAL');
        expect(critical?.raisedAt).toBe(at(0));
        expect(critical?.value).toBe(40);
    });

    it('tracks the worst value seen while the alarm stands', () => {
        let alarms = updateAlarms([], sample({ airTemperature: 39 }), at(0));
        alarms = updateAlarms(alarms, sample({ airTemperature: 44, at: at(1) }), at(1));
        alarms = updateAlarms(alarms, sample({ airTemperature: 39.5, at: at(2) }), at(2));

        expect(alarms.find((alarm) => alarm.level === 'CRITICAL')?.peak).toBe(44);
    });

    it('does not chatter when the value sits on its limit', () => {
        // 38.2 → 37.9 → 38.1 → 37.8: four crossings of the CRITICAL limit,
        // all inside the 0.5 °C deadband. ISA-18.2 exists to stop this
        // producing four alarms; cloud/main.py would emit two.
        const alarms = replayAlarms(
            series([
                { airTemperature: 38.2 },
                { airTemperature: 37.9 },
                { airTemperature: 38.1 },
                { airTemperature: 37.8 },
            ])
        );

        const critical = alarms.filter(
            (alarm) => alarm.channel === 'airTemperature' && alarm.level === 'CRITICAL'
        );

        expect(critical).toHaveLength(1);
        expect(critical[0]?.clearedAt).toBeNull();
    });

    it('returns to normal once the value clears the deadband', () => {
        const alarms = replayAlarms(
            series([{ airTemperature: 39 }, { airTemperature: 37.4 }])
        );

        const critical = alarms.find(
            (alarm) => alarm.channel === 'airTemperature' && alarm.level === 'CRITICAL'
        );

        expect(critical?.clearedAt).toBe(at(1));
    });

    it('starts a new episode when the condition comes back', () => {
        const alarms = replayAlarms(
            series([
                { airTemperature: 39 },
                { airTemperature: 25 },
                { airTemperature: 39 },
            ])
        );

        const critical = alarms.filter(
            (alarm) => alarm.channel === 'airTemperature' && alarm.level === 'CRITICAL'
        );

        expect(critical).toHaveLength(2);
        expect(critical.filter((alarm) => alarm.clearedAt === null)).toHaveLength(1);
    });

    it('leaves another farm’s alarms alone', () => {
        const ambato = updateAlarms([], sample({ airTemperature: 39 }), at(0));
        const both = updateAlarms(
            ambato,
            sample({ assetId: 'GH-TEN-01', soilMoisture: 10, at: at(1) }),
            at(1)
        );

        expect(both.filter((alarm) => alarm.farmId === 'GH-AMB-01')).toHaveLength(2);
        expect(both.filter((alarm) => alarm.farmId === 'GH-TEN-01')).toHaveLength(2);
        expect(both.every((alarm) => alarm.clearedAt === null)).toBe(true);
    });

    it('clears an alarm when the channel stops reporting entirely', () => {
        const raised = updateAlarms([], sample({ batteryPct: 10 }), at(0));
        const gone = updateAlarms(raised, sample({ batteryPct: null, at: at(1) }), at(1));

        expect(gone[0]?.clearedAt).toBe(at(1));
    });
});

describe('acknowledgeAlarm', () => {
    it('records the first acknowledgement and ignores the second', () => {
        const raised = updateAlarms([], sample({ airTemperature: 39 }), at(0));
        const id = raised[0]!.id;

        const once = acknowledgeAlarm(raised, id, at(5));
        const twice = acknowledgeAlarm(once, id, at(9));

        expect(twice.find((alarm) => alarm.id === id)?.acknowledgedAt).toBe(at(5));
    });

    it('survives the next sample', () => {
        const raised = updateAlarms([], sample({ airTemperature: 39 }), at(0));
        const id = raised[0]!.id;
        const acked = acknowledgeAlarm(raised, id, at(1));
        const later = updateAlarms(acked, sample({ airTemperature: 39.2, at: at(2) }), at(2));

        // The one that was acknowledged stays acknowledged; the other alarm
        // raised by the same excursion does not become acknowledged with it.
        expect(later.find((alarm) => alarm.id === id)?.acknowledgedAt).toBe(at(1));
        expect(later.filter((alarm) => alarm.acknowledgedAt === null)).toHaveLength(1);
    });
});

describe('tallyAlarms', () => {
    const alarms: Alarm[] = updateAlarms(
        [],
        sample({ airTemperature: 39, soilMoisture: 10 }),
        at(0)
    );

    it('counts standing alarms by level', () => {
        const tally = tallyAlarms(alarms);

        // Temperature breaches both bands, soil moisture breaches both.
        expect(tally.standing).toBe(4);
        expect(tally.critical).toBe(2);
        expect(tally.warning).toBe(2);
        expect(tally.unacknowledged).toBe(4);
    });

    it('names the most urgent standing alarm', () => {
        expect(tallyAlarms(alarms).worst).toMatchObject({
            channel: 'airTemperature',
            level: 'CRITICAL',
        });
    });

    it('stops counting an alarm once it returns to normal', () => {
        const cleared = replayAlarms(series([{ airTemperature: 39 }, {}]));

        expect(tallyAlarms(cleared).standing).toBe(0);
        expect(tallyAlarms(cleared).worst).toBeNull();
    });

    it('reports zero on a quiet greenhouse rather than nothing at all', () => {
        const tally = tallyAlarms([]);

        expect(tally.standing).toBe(0);
        expect(tally.worst).toBeNull();
    });
});

describe('channelStatus', () => {
    it('ranks a value against both bands', () => {
        expect(channelStatus('airTemperature', 22)).toBe('ok');
        expect(channelStatus('airTemperature', 33)).toBe('warning');
        expect(channelStatus('airTemperature', 39)).toBe('alert');
    });

    it('calls an unmeasured channel offline, not healthy', () => {
        expect(channelStatus('batteryPct', null)).toBe('offline');
        expect(channelStatus('batteryPct', Number.NaN)).toBe('offline');
    });

    it('calls a channel with no WARNING band ok while it is above its minimum', () => {
        expect(channelStatus('rssiDbm', -70)).toBe('ok');
        expect(channelStatus('rssiDbm', -95)).toBe('alert');
    });
});

describe('comfortBand', () => {
    it('gives the warning band for a channel that has one', () => {
        expect(comfortBand('vpd')).toEqual({ low: 0.4, high: 1.2 });
    });

    it('gives nothing for a one-sided limit', () => {
        expect(comfortBand('batteryPct')).toBeNull();
    });
});
