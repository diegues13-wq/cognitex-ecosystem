/**
 * The money maths.
 *
 * This is the product. Everything else on the page is packaging around these
 * twenty lines of arithmetic, so they live apart from React, take plain
 * numbers, return plain numbers, and are tested.
 *
 * The version this replaces did the whole calculation inline in a component:
 *
 *     const commissionAmount = amount * COMMISSION_RATE;   // 0.03
 *     const netAmount        = amount - commissionAmount;
 *     receivedAmount         = netAmount * rateUsdToRub;
 *
 * with no rounding anywhere and `toFixed(2)` only at the moment of display.
 * Three consequences, all of them visible to a customer:
 *
 *  1. The displayed figures did not add up. At $33.33 the commission rendered
 *     as "$1.00" and the converted amount as "$32.33", which is $33.33 — but
 *     the receiving side was computed from the unrounded 32.330100000000002,
 *     so two customers reconciling the same quote by hand got different
 *     answers to the last kopek.
 *  2. `1 / rateUsdToRub` was computed once and then multiplied, so the
 *     RUB→USD direction rounded twice and drifted from a straight division.
 *  3. Nothing rejected NaN, a negative amount, or 1e308, and every one of
 *     those reached `toFixed()` and rendered "NaN" into the WhatsApp message
 *     that a person then sent to an operator.
 *
 * So: every amount is carried as an integer number of minor units (cents,
 * kopeks) and only converted back to a decimal for display. Money is never
 * added, subtracted or compared as a float.
 */

export type Currency = 'USD' | 'RUB';

export type Direction = 'USD_TO_RUB' | 'RUB_TO_USD';

/**
 * How many minor units make one major unit.
 *
 * Both currencies happen to be two-decimal, but keeping it as a table means
 * adding a zero-decimal currency later is a data change rather than a hunt
 * for every `* 100` in the file.
 */
export const MINOR_PER_MAJOR: Record<Currency, number> = { USD: 100, RUB: 100 };

export const CURRENCY_SYMBOL: Record<Currency, string> = { USD: '$', RUB: '₽' };

/** Service fee, as a fraction of the gross amount the sender hands over. */
export const COMMISSION_RATE = 0.03;

/**
 * The rate shown when the market cannot be reached.
 *
 * It is a placeholder, not a quote, and the UI is required to say so — see
 * `src/data/rates.ts`. The old code used the same number as a `useState`
 * default and rendered it behind a green "live" dot, so a customer could read
 * an invented rate as a measured one. Keeping the number but labelling it
 * honestly is the whole fix.
 */
export const FALLBACK_USD_RUB = 100;

/**
 * A USD→RUB rate outside this band is not a USD→RUB rate — it is a broken
 * response, a different currency pair, or a units mix-up. The pair has
 * historically sat between roughly 25 and 120; the band is deliberately far
 * wider than any plausible market so it only ever catches nonsense.
 */
export const RATE_MIN = 1;
export const RATE_MAX = 10_000;

/**
 * Largest amount the calculator will quote, in major units.
 *
 * Chosen so the arithmetic stays exact rather than for business reasons: the
 * worst-case intermediate is `MAX_MAJOR_AMOUNT × 100 minor × RATE_MAX`, which
 * is 1e15 — comfortably inside `Number.MAX_SAFE_INTEGER` (≈9.007e15). Above
 * this cap integer cents stop being representable and the sums would silently
 * start losing units, so the input is clamped and the UI says it clamped.
 */
export const MAX_MAJOR_AMOUNT = 1_000_000_000;

/**
 * Rounds to the nearest integer, halves away from zero.
 *
 * `Math.round` alone is not enough for money. Decimal fractions are not
 * representable in binary, so `1.005 * 100` evaluates to 100.49999999999999
 * and rounds *down* to 100 — a lost cent on a value the user typed as exactly
 * one and a half cents. Re-reading the number at 15 significant digits
 * discards that representation noise before the decision is made, which is
 * enough for every value this calculator can produce.
 *
 * Above 1e12 the reformatting would itself start losing integer precision,
 * and numbers that large have no meaningful fraction left to disambiguate, so
 * the cleanup is skipped there.
 *
 * `Math.round` also breaks ties toward +∞, which makes it asymmetric about
 * zero (-2.5 → -2). Amounts are clamped non-negative before they reach here,
 * but rounding the magnitude keeps the function honest on its own terms.
 */
export function roundHalfUp(value: number): number {
    if (!Number.isFinite(value)) return 0;

    const magnitude = Math.abs(value);
    const cleaned =
        magnitude < 1e12 ? Number.parseFloat(magnitude.toPrecision(15)) : magnitude;
    const rounded = Math.round(cleaned);

    return value < 0 ? -rounded : rounded;
}

/** What had to be done to the number the user gave us, if anything. */
export type AmountAdjustment = 'none' | 'invalid' | 'negative' | 'capped';

export interface NormalisedAmount {
    /** Finite, within [0, MAX_MAJOR_AMOUNT]. */
    amount: number;
    adjustment: AmountAdjustment;
}

/**
 * Forces an arbitrary number into an amount the rest of the module can trust.
 *
 * Returns *why* it changed anything so the interface can tell the user their
 * input was capped instead of quietly quoting a different transfer than the
 * one they asked about.
 */
export function normaliseAmount(raw: number): NormalisedAmount {
    if (typeof raw !== 'number' || Number.isNaN(raw)) {
        return { amount: 0, adjustment: 'invalid' };
    }
    if (raw === Number.POSITIVE_INFINITY) {
        return { amount: MAX_MAJOR_AMOUNT, adjustment: 'capped' };
    }
    // Catches -Infinity too. You cannot send a negative amount; the sensible
    // reading of one is "nothing".
    if (raw < 0) {
        return { amount: 0, adjustment: 'negative' };
    }
    if (raw > MAX_MAJOR_AMOUNT) {
        return { amount: MAX_MAJOR_AMOUNT, adjustment: 'capped' };
    }
    return { amount: raw, adjustment: 'none' };
}

/** Major units → integer minor units. */
export function toMinor(major: number, currency: Currency): number {
    return roundHalfUp(major * MINOR_PER_MAJOR[currency]);
}

/** Integer minor units → major units, for display only. */
export function toMajor(minor: number, currency: Currency): number {
    return minor / MINOR_PER_MAJOR[currency];
}

/** True when a value can be used as a USD→RUB rate without producing nonsense. */
export function isUsableRate(rate: unknown): rate is number {
    return (
        typeof rate === 'number' &&
        Number.isFinite(rate) &&
        rate >= RATE_MIN &&
        rate <= RATE_MAX
    );
}

export function sourceCurrency(direction: Direction): Currency {
    return direction === 'USD_TO_RUB' ? 'USD' : 'RUB';
}

export function targetCurrency(direction: Direction): Currency {
    return direction === 'USD_TO_RUB' ? 'RUB' : 'USD';
}

export function flipDirection(direction: Direction): Direction {
    return direction === 'USD_TO_RUB' ? 'RUB_TO_USD' : 'USD_TO_RUB';
}

export interface QuoteInput {
    /** What the sender typed, in major units of the source currency. */
    amount: number;
    direction: Direction;
    /** RUB per one USD. Unusable values fall back rather than throwing. */
    rateUsdToRub: number;
    /** Fraction of the gross taken as commission. Defaults to COMMISSION_RATE. */
    commissionRate?: number;
}

export interface Quote {
    direction: Direction;
    from: Currency;
    to: Currency;

    /* Integer minor units — the authoritative figures. */
    grossMinor: number;
    commissionMinor: number;
    netMinor: number;
    receivedMinor: number;

    /* The same figures as decimals, for rendering. */
    gross: number;
    commission: number;
    net: number;
    received: number;

    commissionRate: number;
    /** The RUB-per-USD rate actually used, fallback included. */
    rateUsdToRub: number;
    /** Units of `to` per one unit of `from`, for the "1 USD = …" line. */
    appliedRate: number;
    /** The supplied rate was unusable and FALLBACK_USD_RUB stood in for it. */
    usedFallbackRate: boolean;
    adjustment: AmountAdjustment;
}

/**
 * Quotes a transfer.
 *
 * Total function: every input, including NaN, -1 and 1e308, produces a Quote
 * whose numeric fields are finite and whose `*Minor` fields are safe
 * integers. Nothing here can throw and nothing can return NaN, because the
 * result is fed straight into the WhatsApp message a customer sends to a
 * human operator.
 *
 * Order of operations, which is the part with money in it:
 *
 *   1. Clamp the amount, then convert it to integer minor units *once*.
 *   2. Take the commission off the gross and round it to a whole minor unit.
 *   3. Derive the net by subtraction, never by `gross * (1 - rate)`. This
 *      guarantees `commission + net === gross` exactly, so the three lines of
 *      the receipt always add up on screen. Rounding the net independently
 *      would leave a stray unit floating between them.
 *   4. Convert the net at the rate and round once, at the end.
 *
 * Both currencies are two-decimal, so a minor→minor conversion uses the same
 * factor as major→major; no rescaling is needed between steps 3 and 4.
 *
 * The reverse direction divides by the rate rather than multiplying by a
 * precomputed `1 / rate`. The old code did the latter, which rounds twice —
 * once into the reciprocal, once into the result — and drifted by a kopek or
 * two on ordinary amounts.
 */
export function quote({
    amount,
    direction,
    rateUsdToRub,
    commissionRate = COMMISSION_RATE,
}: QuoteInput): Quote {
    const from = sourceCurrency(direction);
    const to = targetCurrency(direction);

    const { amount: safeAmount, adjustment } = normaliseAmount(amount);
    const grossMinor = toMinor(safeAmount, from);

    const usedFallbackRate = !isUsableRate(rateUsdToRub);
    const rate = usedFallbackRate ? FALLBACK_USD_RUB : rateUsdToRub;

    // A commission of 100% or more, or of a negative amount, is a caller bug
    // rather than a business decision; fall back rather than invent money.
    const fee =
        Number.isFinite(commissionRate) && commissionRate >= 0 && commissionRate < 1
            ? commissionRate
            : COMMISSION_RATE;

    const commissionMinor = roundHalfUp(grossMinor * fee);
    const netMinor = grossMinor - commissionMinor;

    const receivedMinor =
        direction === 'USD_TO_RUB'
            ? roundHalfUp(netMinor * rate)
            : roundHalfUp(netMinor / rate);

    return {
        direction,
        from,
        to,

        grossMinor,
        commissionMinor,
        netMinor,
        receivedMinor,

        gross: toMajor(grossMinor, from),
        commission: toMajor(commissionMinor, from),
        net: toMajor(netMinor, from),
        received: toMajor(receivedMinor, to),

        commissionRate: fee,
        rateUsdToRub: rate,
        appliedRate: direction === 'USD_TO_RUB' ? rate : 1 / rate,
        usedFallbackRate,
        adjustment,
    };
}

/**
 * Reads what a person typed into a number of major units.
 *
 * The field accepts free text rather than `<input type="number">` because the
 * page is used in Spanish, English and Russian, and two of those three write
 * one and a half as "1,5". A number input rejects the comma outright: the
 * keystroke is swallowed and `e.target.value` comes back empty, so the amount
 * silently reverted to zero for anyone typing the way they were taught.
 *
 * Grouping separators are ambiguous — "1,234" is one thousand two hundred and
 * thirty-four to an American and 1.234 to a Russian. The rule here: if the
 * string is *only* groups of exactly three digits behind a single kind of
 * separator, the separator is grouping. Otherwise the rightmost separator is
 * the decimal point. Returns NaN for anything unreadable, which
 * `normaliseAmount` turns into zero.
 */
export function parseAmountInput(raw: string): number {
    if (typeof raw !== 'string') return Number.NaN;

    // Strip spaces (including the non-breaking and narrow ones Intl emits as
    // group separators) and anything that is not a digit or a separator.
    const stripped = raw.replace(/[^\d.,-]/g, '');
    if (stripped === '') return Number.NaN;

    const negative = stripped.startsWith('-');
    const digitsAndSeparators = stripped.replace(/-/g, '');

    const lastComma = digitsAndSeparators.lastIndexOf(',');
    const lastDot = digitsAndSeparators.lastIndexOf('.');

    let normalised: string;
    if (lastComma === -1 && lastDot === -1) {
        normalised = digitsAndSeparators;
    } else if (/^\d{1,3}([.,])\d{3}(\1\d{3})*$/.test(digitsAndSeparators)) {
        // Pure grouping: 1,234 · 1.234 · 12,345,678.
        normalised = digitsAndSeparators.replace(/[.,]/g, '');
    } else {
        const decimalAt = Math.max(lastComma, lastDot);
        const whole = digitsAndSeparators.slice(0, decimalAt).replace(/[.,]/g, '');
        const fraction = digitsAndSeparators.slice(decimalAt + 1).replace(/[.,]/g, '');
        normalised = `${whole}.${fraction}`;
    }

    const value = Number.parseFloat(normalised);
    if (!Number.isFinite(value)) return Number.NaN;

    return negative ? -value : value;
}

/**
 * Formats a decimal amount for reading, always with both minor digits.
 *
 * Groups and places the decimal separator the way the chosen language does,
 * because a Russian reader seeing "1,234.56" reads it as one and a bit.
 */
export function formatAmount(major: number, locale: string): string {
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(major) ? major : 0);
}

/**
 * Machine-readable form for the WhatsApp message.
 *
 * Deliberately not localised: an operator reading "1.234,56" in one message
 * and "1,234.56" in the next has to guess, and the guess is worth a thousand
 * dollars. A plain dotted decimal means the same thing everywhere.
 */
export function formatPlain(major: number): string {
    return (Number.isFinite(major) ? major : 0).toFixed(2);
}
