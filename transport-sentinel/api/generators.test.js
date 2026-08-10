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

import { ROUTES, generateTrainSchedule } from './generators.js';

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
