import { describe, expect, it } from 'vitest';

import { answerQuery, parseQuery } from './query';
import { updateAlarms } from './alarms';
import { at, sample, series } from './fixtures';

const window = series([
    { airTemperature: 18, humidity: 80, co2: 500 },
    { airTemperature: 34, humidity: 60, co2: 900 },
    { airTemperature: 22, humidity: 70, co2: 700 },
]);

describe('parseQuery', () => {
    it('reads intent and channel out of a Spanish question', () => {
        expect(parseQuery('¿Cuál fue la temperatura máxima este mes?')).toEqual({
            intent: 'max',
            channel: 'airTemperature',
        });
    });

    it('ignores accents and case', () => {
        expect(parseQuery('PROMEDIO DE HUMEDAD')).toEqual({
            intent: 'mean',
            channel: 'humidity',
        });
    });

    it('prefers the more specific channel phrase', () => {
        // "humedad de suelo" is not a question about relative humidity.
        expect(parseQuery('¿Cómo está la humedad del suelo?').channel).toBe('soilMoisture');
    });

    it('does not mistake "para" for a question about PAR', () => {
        // The old regex was /luz|par|rad|light/ over the raw string, so this
        // question was answered with a radiation figure.
        expect(parseQuery('¿Cuál es la temperatura para hoy?').channel).toBe('airTemperature');
    });

    it('understands CO₂ written with a subscript', () => {
        expect(parseQuery('¿Cuál fue el pico de CO₂?')).toEqual({
            intent: 'max',
            channel: 'co2',
        });
    });

    it('treats a bare channel name as a request for its current value', () => {
        expect(parseQuery('vpd')).toEqual({ intent: 'latest', channel: 'vpd' });
    });

    it('falls back to help rather than guessing', () => {
        expect(parseQuery('hola, ¿qué tal?')).toEqual({ intent: 'help', channel: null });
    });
});

describe('answerQuery', () => {
    it('answers a maximum with the value and when it happened', () => {
        const answer = answerQuery('temperatura máxima', { samples: window, alarms: [] });

        expect(answer).toMatchObject({
            kind: 'stat',
            intent: 'max',
            value: 34,
            at: at(1),
        });
    });

    it('answers a mean without pretending it happened at an instant', () => {
        const answer = answerQuery('promedio de co2', { samples: window, alarms: [] });

        expect(answer.kind).toBe('stat');
        if (answer.kind !== 'stat') return;
        expect(answer.value).toBeCloseTo(700, 6);
        expect(answer.at).toBeNull();
    });

    it('lists standing alarms and only standing ones', () => {
        const alarms = updateAlarms([], sample({ airTemperature: 39 }), at(0));
        const answer = answerQuery('¿hay alarmas activas?', { samples: window, alarms });

        expect(answer).toMatchObject({ kind: 'alarms', total: 2 });
    });

    it('reports zero alarms as an answer, not as an error', () => {
        const answer = answerQuery('alarmas', { samples: window, alarms: [] });

        expect(answer).toMatchObject({ kind: 'alarms', total: 0 });
    });

    it('summarises the greenhouse from the newest sample', () => {
        const answer = answerQuery('¿cómo está el invernadero?', {
            samples: window,
            alarms: [],
        });

        expect(answer.kind).toBe('status');
        if (answer.kind !== 'status') return;
        expect(answer.sample.at).toBe(at(2));
        expect(answer.risk.level).toBeDefined();
    });

    it('says there is nothing rather than answering from an empty window', () => {
        expect(answerQuery('temperatura máxima', { samples: [], alarms: [] })).toMatchObject({
            kind: 'empty',
        });
    });

    it('says which channel is missing when only that one is', () => {
        const answer = answerQuery('batería mínima', {
            samples: series([{ batteryPct: null }, { batteryPct: null }]),
            alarms: [],
        });

        expect(answer.kind).toBe('empty');
        if (answer.kind !== 'empty') return;
        expect(answer.reason).toContain('batería');
    });

    it('offers examples when it does not understand', () => {
        const answer = answerQuery('cuéntame un chiste', { samples: window, alarms: [] });

        expect(answer.kind).toBe('help');
        if (answer.kind !== 'help') return;
        expect(answer.examples.length).toBeGreaterThan(0);
    });
});
