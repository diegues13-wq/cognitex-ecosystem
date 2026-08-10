import { FALLBACK_USD_RUB, isUsableRate } from '../domain/exchange';

/**
 * Where the exchange rate comes from, and whether it really came from there.
 *
 * The version this replaces was three lines:
 *
 *     const res  = await fetch('…/latest/USD');
 *     const data = await res.json();
 *     if (data?.rates?.RUB) setRateUsdToRub(data.rates.RUB);
 *
 * with a `catch` that only wrote to the console. When the API was down, the
 * component kept its `useState(100)` default and rendered it next to a green
 * dot with a glow — the universal interface convention for "live". A customer
 * in a hotel with a captive portal, or behind a network that blocks the
 * endpoint, was shown an invented rate as if it had come from the market, and
 * then handed a WhatsApp message quoting it.
 *
 * That is the honesty rule in packages/README.md — "we sell measurement, so we
 * say when we are not measuring" — applied to a number that decides how much
 * money someone sends. So the fetch returns *what it knows and how it knows
 * it*, and the interface is obliged to render the difference.
 */

export type RateSource = 'live' | 'fallback';

/** Why the fallback is standing in, when it is. */
export type FallbackReason =
    /** Nothing has been fetched yet — first paint. */
    | 'initial'
    /** The request failed, was blocked, or the server answered with an error. */
    | 'network'
    /** The response arrived but had no numeric RUB rate in it. */
    | 'malformed'
    /** A number arrived, but not one that can be a USD→RUB rate. */
    | 'out-of-range';

export interface RateResult {
    /** RUB per one USD. */
    rate: number;
    source: RateSource;
    /** When the live rate was read, in ms since epoch. Null if it never was. */
    fetchedAt: number | null;
    /** Set only when `source` is 'fallback'. */
    reason: FallbackReason | null;
}

export const RATE_ENDPOINT = 'https://api.exchangerate-api.com/v4/latest/USD';

export const RATE_REFRESH_MS = 60_000;

/** What the calculator shows before the first response arrives. */
export const INITIAL_RATE: RateResult = {
    rate: FALLBACK_USD_RUB,
    source: 'fallback',
    fetchedAt: null,
    reason: 'initial',
};

function fallback(reason: FallbackReason): RateResult {
    return { rate: FALLBACK_USD_RUB, source: 'fallback', fetchedAt: null, reason };
}

/**
 * Digs the RUB rate out of an unknown JSON body without trusting its shape.
 *
 * The endpoint is third-party and unauthenticated; it can answer with an
 * error object, an HTML captive-portal page parsed as JSON, or a payload
 * whose `rates.RUB` is the string "92.5". None of those may become a number
 * the calculator multiplies by.
 */
function readRubRate(body: unknown): number | null {
    if (typeof body !== 'object' || body === null) return null;

    const rates = (body as { rates?: unknown }).rates;
    if (typeof rates !== 'object' || rates === null) return null;

    const rub = (rates as Record<string, unknown>).RUB;
    return typeof rub === 'number' ? rub : null;
}

/**
 * Reads the USD→RUB rate. Never throws, never returns NaN.
 *
 * Callers get a usable rate in every case; what changes is whether the result
 * claims to be live.
 */
export async function fetchUsdRubRate(signal?: AbortSignal): Promise<RateResult> {
    try {
        const response = await fetch(RATE_ENDPOINT, signal ? { signal } : {});
        if (!response.ok) return fallback('network');

        const body: unknown = await response.json();
        const rate = readRubRate(body);

        if (rate === null) return fallback('malformed');
        if (!isUsableRate(rate)) return fallback('out-of-range');

        return { rate, source: 'live', fetchedAt: Date.now(), reason: null };
    } catch {
        // Network failure, abort, CORS, invalid JSON. All of them mean the
        // same thing to a customer: we do not know today's rate.
        return fallback('network');
    }
}
