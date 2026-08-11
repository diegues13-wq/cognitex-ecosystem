/**
 * Regression tests for the schedule generator.
 *
 * Run with: node --test
 * (node:test is built in, so this adds no dependency to the API image.)
 *
 * The loop these cover used to hang the entire single-threaded API process on
 * the first load of the default view. Any change to the iteration must keep
 * every route terminating.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
    ROUTES,
    TRAINS,
    generateAlerts,
    generateEnergyData,
    generateTrainSchedule,
} from './generators.js';

test('every route terminates and returns a finite schedule', () => {
    for (const route of ROUTES) {
        const started = Date.now();
        const schedule = generateTrainSchedule(route.id);

        assert.ok(Array.isArray(schedule.services), `${route.id} returned no services array`);
        assert.ok(
            schedule.services.length < 500,
            `${route.id} produced ${schedule.services.length} services — the loop is not bounded`
        );
        assert.ok(Date.now() - started < 1000, `${route.id} took too long; suspect a hang`);
    }
});

test('a sub-hourly frequency produces one service per interval', () => {
    // RT-001: 30-minute frequency, 05:00-23:00. This is the case that hung:
    // the loop advanced by whole hours, so a 30-minute step never moved it.
    const route = ROUTES.find((r) => r.id === 'RT-001');
    const schedule = generateTrainSchedule('RT-001');

    assert.equal(route.scheduledFreqMin, 30, 'fixture changed: RT-001 is no longer half-hourly');
    assert.ok(schedule.services.length > 1, 'a half-hourly route must run more than one service');

    const departures = schedule.services.map((s) => s.departureMin - s.delayMin);
    for (let i = 1; i < departures.length; i++) {
        assert.equal(
            departures[i] - departures[i - 1],
            route.scheduledFreqMin,
            'departures must be exactly one frequency interval apart'
        );
    }
});

test('services stay inside the operating window', () => {
    for (const route of ROUTES) {
        const { services } = generateTrainSchedule(route.id);
        const endMin = Number(route.operatingHours.end.split(':')[0]) * 60;
        const startMin =
            Number(route.operatingHours.start.split(':')[0]) * 60 +
            Number(route.operatingHours.start.split(':')[1]);

        for (const service of services) {
            const planned = service.departureMin - service.delayMin;
            assert.ok(planned >= startMin, `${route.id} departs before opening`);
            assert.ok(planned <= endMin, `${route.id} departs after closing`);
        }
    }
});

test('service ids are unique within a schedule', () => {
    for (const route of ROUTES) {
        const { services } = generateTrainSchedule(route.id);
        const ids = services.map((s) => s.id);
        assert.equal(new Set(ids).size, ids.length, `${route.id} has duplicate service ids`);
    }
});

test('an unknown route id falls back instead of throwing', () => {
    const schedule = generateTrainSchedule('RT-DOES-NOT-EXIST');
    assert.ok(schedule.route, 'expected a fallback route');
});

/**
 * Alerts are the other shape that was wrong in production.
 *
 * The API emitted `{ time: 'HH:mm', priority: 'CRITICAL' }` while the browser
 * generator emitted `{ timestamp, severity }`, so the ticker rendered no time
 * and the CCO critical filter matched nothing. The wire shape is now the
 * `Alert` interface from @cognitex/data, and these hold the producer to it.
 */

const SHARED_STATUSES = new Set(['ok', 'warning', 'alert', 'offline']);

test('alerts carry the shared Alert shape', () => {
    const alerts = generateAlerts('todos');
    assert.ok(alerts.length > 0, 'expected at least one alert');

    for (const alert of alerts) {
        assert.equal(typeof alert.id, 'string', 'id must be a string');
        assert.equal(typeof alert.orgId, 'string', 'every document carries a tenant');
        assert.equal(typeof alert.assetId, 'string', 'assetId is a string, "" for network-wide');
        assert.equal(typeof alert.message, 'string');
        assert.equal(typeof alert.at, 'number', 'at must be epoch millis, not a clock string');
        assert.ok(Number.isFinite(alert.at) && alert.at > 0, 'at must be a real instant');
        assert.ok(SHARED_STATUSES.has(alert.status), `unknown status ${alert.status}`);
        assert.equal(alert.acknowledgedAt, null);

        assert.equal(alert.time, undefined, 'the pre-formatted `time` field must not come back');
        assert.equal(alert.priority, undefined, '`priority` was replaced by `status`');
    }
});

test('at least one alert is critical, so the CCO filter has something to match', () => {
    const critical = generateAlerts('todos').filter((a) => a.status === 'alert');
    assert.ok(critical.length > 0, 'the fixture must exercise the critical path');
});

/**
 * A ratio that cannot vary is a constant, and drawing a constant as a
 * thirty-day trend line tells an operator something false about their
 * railway. Both of these used to be algebraically fixed:
 * `kwhElec / (kwhElec / 6.5)` is 6.5, and `kwhElec * 0.12` is 12 %.
 */
test('specific energy intensity varies day to day', () => {
    const days = generateEnergyData(30);
    const intensities = new Set(days.map((d) => d.specifickWhKm));
    assert.ok(intensities.size > 5, 'kWh per train-km is effectively a constant');

    for (const day of days) {
        assert.ok(day.trainKmElectrico > 0, 'the denominator must be a real distance');
        const derived = day.kwhElectrico / day.trainKmElectrico;
        assert.ok(
            Math.abs(derived - day.specifickWhKm) < 0.01,
            'the published intensity must match its own numerator and denominator'
        );
        assert.ok(day.specifickWhKm > 5 && day.specifickWhKm < 10, 'intensity out of plausible range');
    }
});

test('regenerated energy is a varying share, not a fixed fraction', () => {
    const shares = new Set(
        generateEnergyData(30).map((d) => Math.round((d.kwhRegen / d.kwhElectrico) * 1000))
    );
    assert.ok(shares.size > 5, 'the regenerated share is effectively a constant');
});

test('the fleet filter keeps network-wide alerts and drops the other segment', () => {
    const typeById = Object.fromEntries(TRAINS.map((t) => [t.id, t.type]));

    for (const fleetType of ['pasajeros', 'carga']) {
        for (const alert of generateAlerts(fleetType)) {
            if (!alert.assetId) continue; // network-wide, always kept
            assert.equal(
                typeById[alert.assetId],
                fleetType,
                `${alert.id} does not belong to the ${fleetType} fleet`
            );
        }
    }

    const networkWide = generateAlerts('carga').filter((a) => a.assetId === '');
    assert.ok(networkWide.length > 0, 'a network-wide alert must survive every filter');
});
