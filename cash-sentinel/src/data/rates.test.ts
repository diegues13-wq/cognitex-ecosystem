import { afterEach, describe, expect, it, vi } from 'vitest';

import { FALLBACK_USD_RUB } from '../domain/exchange';
import { INITIAL_RATE, fetchUsdRubRate } from './rates';

/**
 * The point of these is the `source` field, not the number.
 *
 * A rate that is wrong is a business problem. A rate that is wrong while the
 * page claims it is live is a lie told to someone about to send money abroad,
 * and that is what the previous implementation did on every network failure.
 */

function respondWith(body: unknown, ok = true): void {
    vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({ ok, json: async () => body }) as unknown as Response),
    );
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('fetchUsdRubRate', () => {
    it('reports a good response as live, with the time it arrived', async () => {
        respondWith({ rates: { RUB: 92.5, EUR: 0.9 } });

        const result = await fetchUsdRubRate();

        expect(result).toMatchObject({ rate: 92.5, source: 'live', reason: null });
        expect(result.fetchedAt).toBeTypeOf('number');
    });

    it('falls back, and says so, when the request throws', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => {
                throw new TypeError('Failed to fetch');
            }),
        );

        const result = await fetchUsdRubRate();

        expect(result).toEqual({
            rate: FALLBACK_USD_RUB,
            source: 'fallback',
            fetchedAt: null,
            reason: 'network',
        });
    });

    it('falls back on a non-2xx response', async () => {
        respondWith({ rates: { RUB: 92.5 } }, false);

        const result = await fetchUsdRubRate();

        expect(result.source).toBe('fallback');
        expect(result.reason).toBe('network');
    });

    it('falls back when the body is not the shape we expected', async () => {
        for (const body of [null, 'nope', {}, { rates: null }, { rates: { RUB: '92.5' } }]) {
            respondWith(body);

            const result = await fetchUsdRubRate();

            expect(result.source).toBe('fallback');
            expect(result.reason).toBe('malformed');
        }
    });

    it('refuses a number that cannot be a USD→RUB rate', async () => {
        for (const rub of [0, -92.5, 1e9]) {
            respondWith({ rates: { RUB: rub } });

            const result = await fetchUsdRubRate();

            expect(result.source).toBe('fallback');
            expect(result.reason).toBe('out-of-range');
            expect(result.rate).toBe(FALLBACK_USD_RUB);
        }
    });

    it('never claims a timestamp it does not have', async () => {
        expect(INITIAL_RATE.fetchedAt).toBeNull();
        expect(INITIAL_RATE.source).toBe('fallback');
        expect(INITIAL_RATE.reason).toBe('initial');
    });
});
