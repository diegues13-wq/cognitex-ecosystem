import { describe, expect, it } from 'vitest';

import {
    COMMISSION_RATE,
    FALLBACK_USD_RUB,
    MAX_MAJOR_AMOUNT,
    formatAmount,
    formatPlain,
    isUsableRate,
    normaliseAmount,
    parseAmountInput,
    quote,
    roundHalfUp,
    toMajor,
    toMinor,
} from './exchange';

/**
 * These tests are the reason the arithmetic was pulled out of the component.
 *
 * Every case below is something the previous inline version got wrong or
 * could not express: a commission computed on a float, a receipt whose lines
 * did not add up, a negative amount, an amount past the point where cents
 * stop being representable, and a rate the API never sent.
 */

const LIVE_RATE = 92.5;

describe('roundHalfUp', () => {
    it('rounds a half up', () => {
        expect(roundHalfUp(0.5)).toBe(1);
        expect(roundHalfUp(1.5)).toBe(2);
        expect(roundHalfUp(2.5)).toBe(3);
    });

    it('rounds a half away from zero, not toward +∞ like Math.round', () => {
        expect(Math.round(-2.5)).toBe(-2);
        expect(roundHalfUp(-2.5)).toBe(-3);
    });

    it('sees through binary representation noise', () => {
        // The exact failure the money code used to have: the user typed
        // 1.005, the machine held 100.49999999999999, and a cent vanished.
        expect(Math.round(1.005 * 100)).toBe(100);
        expect(roundHalfUp(1.005 * 100)).toBe(101);
    });

    it('leaves large integers alone rather than reformatting them', () => {
        expect(roundHalfUp(9_700_000_000_000_00)).toBe(970_000_000_000_000);
        expect(Number.isSafeInteger(roundHalfUp(1e15))).toBe(true);
    });

    it('maps non-finite input to zero instead of propagating it', () => {
        expect(roundHalfUp(Number.NaN)).toBe(0);
        expect(roundHalfUp(Number.POSITIVE_INFINITY)).toBe(0);
        expect(roundHalfUp(Number.NEGATIVE_INFINITY)).toBe(0);
    });
});

describe('toMinor / toMajor', () => {
    it('converts whole amounts exactly', () => {
        expect(toMinor(100, 'USD')).toBe(10_000);
        expect(toMinor(1, 'RUB')).toBe(100);
        expect(toMajor(10_000, 'USD')).toBe(100);
    });

    it('absorbs float addition error', () => {
        expect(0.1 + 0.2).not.toBe(0.3);
        expect(toMinor(0.1 + 0.2, 'USD')).toBe(30);
    });

    it('rounds fractions of a cent half up', () => {
        expect(toMinor(1.005, 'USD')).toBe(101);
        expect(toMinor(1.004, 'USD')).toBe(100);
    });

    it('round-trips through minor units', () => {
        for (const major of [0, 0.01, 7.35, 33.33, 1_000_000.99]) {
            expect(toMajor(toMinor(major, 'USD'), 'USD')).toBe(major);
        }
    });
});

describe('normaliseAmount', () => {
    it('accepts an ordinary amount unchanged', () => {
        expect(normaliseAmount(250.75)).toEqual({ amount: 250.75, adjustment: 'none' });
    });

    it('reports NaN rather than passing it on', () => {
        expect(normaliseAmount(Number.NaN)).toEqual({ amount: 0, adjustment: 'invalid' });
    });

    it('floors a negative amount at zero and says so', () => {
        expect(normaliseAmount(-1)).toEqual({ amount: 0, adjustment: 'negative' });
        expect(normaliseAmount(Number.NEGATIVE_INFINITY)).toEqual({
            amount: 0,
            adjustment: 'negative',
        });
    });

    it('caps an absurd amount at the last exactly-representable one', () => {
        expect(normaliseAmount(1e300)).toEqual({
            amount: MAX_MAJOR_AMOUNT,
            adjustment: 'capped',
        });
        expect(normaliseAmount(Number.POSITIVE_INFINITY)).toEqual({
            amount: MAX_MAJOR_AMOUNT,
            adjustment: 'capped',
        });
    });
});

describe('quote — commission', () => {
    it('takes three percent of the gross', () => {
        const q = quote({ amount: 100, direction: 'USD_TO_RUB', rateUsdToRub: LIVE_RATE });

        expect(q.commissionRate).toBe(COMMISSION_RATE);
        expect(q.commissionMinor).toBe(300);
        expect(q.commission).toBe(3);
        expect(q.net).toBe(97);
    });

    it('rounds the commission to a whole cent, half up', () => {
        // 3% of $0.50 is $0.015 exactly — the tie case.
        const q = quote({ amount: 0.5, direction: 'USD_TO_RUB', rateUsdToRub: LIVE_RATE });

        expect(q.commissionMinor).toBe(2);
        expect(q.netMinor).toBe(48);
    });

    it('derives the net by subtraction so the receipt always adds up', () => {
        // $33.33 is the case the old code rendered as 1.00 + 32.33 on screen
        // while converting from an unrounded 32.330100000000002.
        for (const amount of [0, 0.01, 0.17, 1, 33.33, 99.99, 1234.56, 999_999.99]) {
            const q = quote({ amount, direction: 'USD_TO_RUB', rateUsdToRub: LIVE_RATE });

            expect(q.commissionMinor + q.netMinor).toBe(q.grossMinor);
            expect(Number.isSafeInteger(q.commissionMinor)).toBe(true);
            expect(Number.isSafeInteger(q.netMinor)).toBe(true);
        }
    });

    it('ignores a commission rate that would invent or confiscate money', () => {
        for (const bad of [-0.1, 1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
            const q = quote({
                amount: 100,
                direction: 'USD_TO_RUB',
                rateUsdToRub: LIVE_RATE,
                commissionRate: bad,
            });
            expect(q.commissionRate).toBe(COMMISSION_RATE);
        }
    });

    it('honours a legitimate override', () => {
        const q = quote({
            amount: 100,
            direction: 'USD_TO_RUB',
            rateUsdToRub: LIVE_RATE,
            commissionRate: 0,
        });

        expect(q.commissionMinor).toBe(0);
        expect(q.netMinor).toBe(q.grossMinor);
    });
});

describe('quote — conversion', () => {
    it('converts USD to RUB by multiplying the net once', () => {
        const q = quote({ amount: 100, direction: 'USD_TO_RUB', rateUsdToRub: LIVE_RATE });

        // 9700 kopeks-worth of dollars × 92.5 = 897 250 kopeks.
        expect(q.receivedMinor).toBe(897_250);
        expect(q.received).toBe(8972.5);
        expect(q.from).toBe('USD');
        expect(q.to).toBe('RUB');
        expect(q.appliedRate).toBe(LIVE_RATE);
    });

    it('converts RUB to USD by dividing, not by multiplying a reciprocal', () => {
        const q = quote({ amount: 1000, direction: 'RUB_TO_USD', rateUsdToRub: LIVE_RATE });

        expect(q.grossMinor).toBe(100_000);
        expect(q.netMinor).toBe(97_000);
        // 97 000 / 92.5 = 1048.648…, so 1049 kopeks-worth of cents.
        expect(q.receivedMinor).toBe(1049);
        expect(q.received).toBe(10.49);
        expect(q.from).toBe('RUB');
        expect(q.to).toBe('USD');
    });

    it('never lands more than half a minor unit from the exact result', () => {
        for (const amount of [0.03, 1, 7.77, 250, 8_888.88, 100_000]) {
            for (const direction of ['USD_TO_RUB', 'RUB_TO_USD'] as const) {
                const q = quote({ amount, direction, rateUsdToRub: LIVE_RATE });
                const exact =
                    direction === 'USD_TO_RUB'
                        ? q.netMinor * LIVE_RATE
                        : q.netMinor / LIVE_RATE;

                expect(Math.abs(q.receivedMinor - exact)).toBeLessThanOrEqual(0.5);
                expect(Number.isSafeInteger(q.receivedMinor)).toBe(true);
            }
        }
    });
});

describe('quote — hostile input', () => {
    it('quotes zero as zero, not as "no data"', () => {
        const q = quote({ amount: 0, direction: 'USD_TO_RUB', rateUsdToRub: LIVE_RATE });

        expect(q.adjustment).toBe('none');
        expect(q.grossMinor).toBe(0);
        expect(q.commissionMinor).toBe(0);
        expect(q.netMinor).toBe(0);
        expect(q.receivedMinor).toBe(0);
        expect(q.received).toBe(0);
    });

    it('treats a negative amount as nothing and reports the correction', () => {
        const q = quote({ amount: -500, direction: 'USD_TO_RUB', rateUsdToRub: LIVE_RATE });

        expect(q.adjustment).toBe('negative');
        expect(q.grossMinor).toBe(0);
        expect(q.receivedMinor).toBe(0);
    });

    it('caps an absurd amount and keeps every figure an exact integer', () => {
        const q = quote({
            amount: Number.MAX_VALUE,
            direction: 'USD_TO_RUB',
            // Worst case: the largest rate the band admits.
            rateUsdToRub: 10_000,
        });

        expect(q.adjustment).toBe('capped');
        expect(q.gross).toBe(MAX_MAJOR_AMOUNT);
        expect(Number.isSafeInteger(q.grossMinor)).toBe(true);
        expect(Number.isSafeInteger(q.receivedMinor)).toBe(true);
        expect(q.receivedMinor).toBe(970_000_000_000_000);
        expect(q.receivedMinor).toBeLessThan(Number.MAX_SAFE_INTEGER);
    });

    it('returns finite figures for every nasty input, in both directions', () => {
        const amounts = [
            Number.NaN,
            Number.POSITIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
            -0,
            -1e-9,
            1e-9,
            1e308,
        ];

        for (const amount of amounts) {
            for (const direction of ['USD_TO_RUB', 'RUB_TO_USD'] as const) {
                const q = quote({ amount, direction, rateUsdToRub: LIVE_RATE });

                for (const value of [
                    q.grossMinor,
                    q.commissionMinor,
                    q.netMinor,
                    q.receivedMinor,
                    q.gross,
                    q.commission,
                    q.net,
                    q.received,
                ]) {
                    expect(Number.isFinite(value)).toBe(true);
                }
                expect(formatPlain(q.received)).not.toContain('NaN');
            }
        }
    });
});

describe('quote — the fallback rate path', () => {
    it('substitutes the fallback when the rate is unusable, and says it did', () => {
        for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, 1e9, 0.0001]) {
            const q = quote({ amount: 100, direction: 'USD_TO_RUB', rateUsdToRub: bad });

            expect(q.usedFallbackRate).toBe(true);
            expect(q.rateUsdToRub).toBe(FALLBACK_USD_RUB);
            expect(q.receivedMinor).toBe(9700 * FALLBACK_USD_RUB);
        }
    });

    it('does not claim a fallback when the rate is usable', () => {
        const q = quote({ amount: 100, direction: 'USD_TO_RUB', rateUsdToRub: LIVE_RATE });

        expect(q.usedFallbackRate).toBe(false);
        expect(q.rateUsdToRub).toBe(LIVE_RATE);
    });

    it('cannot divide by zero in the reverse direction', () => {
        const q = quote({ amount: 1000, direction: 'RUB_TO_USD', rateUsdToRub: 0 });

        expect(q.usedFallbackRate).toBe(true);
        expect(Number.isFinite(q.received)).toBe(true);
        expect(q.receivedMinor).toBe(970);
    });
});

describe('isUsableRate', () => {
    it('accepts a plausible market rate', () => {
        expect(isUsableRate(92.5)).toBe(true);
        expect(isUsableRate(1)).toBe(true);
        expect(isUsableRate(10_000)).toBe(true);
    });

    it('rejects anything that is not a USD→RUB rate', () => {
        expect(isUsableRate(0)).toBe(false);
        expect(isUsableRate(-92.5)).toBe(false);
        expect(isUsableRate(10_001)).toBe(false);
        expect(isUsableRate(Number.NaN)).toBe(false);
        expect(isUsableRate('92.5')).toBe(false);
        expect(isUsableRate(null)).toBe(false);
        expect(isUsableRate(undefined)).toBe(false);
    });
});

describe('parseAmountInput', () => {
    it('reads a plain number', () => {
        expect(parseAmountInput('100')).toBe(100);
        expect(parseAmountInput('0')).toBe(0);
        expect(parseAmountInput('12.34')).toBe(12.34);
    });

    it('reads a comma as a decimal separator, as Spanish and Russian write it', () => {
        expect(parseAmountInput('1,5')).toBe(1.5);
        expect(parseAmountInput('12,34')).toBe(12.34);
    });

    it('reads grouped thousands in either convention', () => {
        expect(parseAmountInput('1,234')).toBe(1234);
        expect(parseAmountInput('1.234')).toBe(1234);
        expect(parseAmountInput('12,345,678')).toBe(12_345_678);
    });

    it('resolves mixed separators by taking the rightmost as the decimal point', () => {
        expect(parseAmountInput('1,234.56')).toBe(1234.56);
        expect(parseAmountInput('1.234,56')).toBe(1234.56);
    });

    it('ignores spaces and currency symbols', () => {
        expect(parseAmountInput('$100')).toBe(100);
        expect(parseAmountInput('1 234,56')).toBe(1234.56);
        expect(parseAmountInput('₽ 50')).toBe(50);
    });

    it('returns NaN for anything unreadable, for normaliseAmount to handle', () => {
        expect(parseAmountInput('')).toBeNaN();
        expect(parseAmountInput('abc')).toBeNaN();
        expect(parseAmountInput('.')).toBeNaN();
    });

    it('keeps a minus sign so the negative branch is reachable', () => {
        expect(parseAmountInput('-50')).toBe(-50);
    });
});

describe('formatting', () => {
    it('always shows both minor digits', () => {
        expect(formatAmount(1234.5, 'en-US')).toBe('1,234.50');
        expect(formatAmount(0, 'en-US')).toBe('0.00');
    });

    it('follows the reader’s decimal convention', () => {
        expect(formatAmount(1.5, 'ru-RU')).toContain(',');
        expect(formatAmount(1.5, 'es-EC')).toContain(',');
    });

    it('never renders NaN', () => {
        expect(formatAmount(Number.NaN, 'en-US')).toBe('0.00');
        expect(formatPlain(Number.NaN)).toBe('0.00');
    });

    it('writes the WhatsApp figure unambiguously, without grouping', () => {
        expect(formatPlain(1234.5)).toBe('1234.50');
    });
});
