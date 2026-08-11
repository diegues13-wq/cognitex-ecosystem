/**
 * Air physics.
 *
 * This is the one calculation the platform is actually named after, so it is
 * worth being exact about where it comes from.
 *
 * **Saturation vapour pressure** uses the Magnus–Tetens form adopted by the
 * FAO as equation 11 of Irrigation and Drainage Paper 56 (Allen, Pereira,
 * Raes & Smith, 1998):
 *
 *     e°(T) = 0.6108 · exp( 17.27 · T / (T + 237.3) )      [kPa, T in °C]
 *
 * FAO-56 Annex 2, Table 2.3 tabulates it: e°(0 °C) = 0.611 kPa,
 * e°(20 °C) = 2.338 kPa, e°(25 °C) = 3.168 kPa, e°(30 °C) = 4.243 kPa. Those
 * four values are what `psychrometrics.test.ts` checks against, which is the
 * point of writing the formula down rather than trusting it.
 *
 * **Vapour pressure deficit** is then e°(T) − e_a with e_a = e°(T)·RH/100
 * (FAO-56 eq. 17 and 19), i.e. e°(T)·(1 − RH/100).
 *
 * **Dew point** inverts the same Magnus form — the standard rearrangement, in
 * Lawrence (2005), *The Relationship between Relative Humidity and the
 * Dewpoint Temperature in Moist Air*, BAMS 86(2):225–233:
 *
 *     α  = ln(RH/100) + a·T/(b + T)
 *     Td = b·α / (a − α)
 *
 * with a = 17.27 and b = 237.7 °C. Alduchov & Eskridge's (1996) refit
 * (17.625 / 243.04) is marginally more accurate below freezing, but the
 * coefficients here are the ones `cloud/main.py:97` already uses and the
 * agreement between the console and the ingest function is worth more than
 * the third decimal place.
 *
 * The constant is written 0.61078 rather than FAO's rounded 0.6108 because
 * that is what `edge`, `cloud` and the old browser generator all used; the
 * difference is 3 × 10⁻⁵ kPa.
 */

/** Magnus coefficients. Dimensionless and °C respectively. */
const MAGNUS_A = 17.27;
const MAGNUS_B = 237.3;
/** The dew-point inversion uses 237.7, not 237.3 — see cloud/main.py:97. */
const DEWPOINT_B = 237.7;
/** e°(0 °C) in kPa. */
const E0 = 0.61078;

/** True for a number that can take part in a calculation at all. */
function usable(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Saturation vapour pressure of water, kPa.
 *
 * Returns null rather than NaN for unusable input, so a missing sensor reads
 * as "no measurement" all the way to the screen instead of becoming a blank
 * where a number should be.
 */
export function saturationVapourPressure(temperatureC: number): number | null {
    if (!usable(temperatureC)) return null;
    // The denominator vanishes at −237.3 °C, well below anything physical.
    if (temperatureC <= -MAGNUS_B) return null;

    return E0 * Math.exp((MAGNUS_A * temperatureC) / (temperatureC + MAGNUS_B));
}

/** Actual vapour pressure, kPa: the saturation value scaled by humidity. */
export function actualVapourPressure(temperatureC: number, relativeHumidity: number): number | null {
    const svp = saturationVapourPressure(temperatureC);
    if (svp === null || !usable(relativeHumidity)) return null;
    if (relativeHumidity < 0 || relativeHumidity > 100) return null;

    return svp * (relativeHumidity / 100);
}

/**
 * Vapour pressure deficit, kPa — how much more water the air could hold.
 *
 * Zero at saturation, never negative. It is the number a grower actually
 * steers on: below ~0.4 kPa transpiration stalls and Botrytis takes hold,
 * above ~1.2 kPa the stomata start closing.
 */
export function vapourPressureDeficit(
    temperatureC: number,
    relativeHumidity: number
): number | null {
    const svp = saturationVapourPressure(temperatureC);
    const avp = actualVapourPressure(temperatureC, relativeHumidity);
    if (svp === null || avp === null) return null;

    // Clamped at zero: floating point can otherwise produce −1e−17 at 100% RH,
    // which then renders as "-0.00 kPa".
    return Math.max(0, svp - avp);
}

/**
 * Dew point, °C.
 *
 * Null below 1% RH, where the logarithm runs away and the answer stops being
 * physically meaningful — a sensor reporting 0% RH is a broken sensor, not
 * air at −273 °C.
 */
export function dewPoint(temperatureC: number, relativeHumidity: number): number | null {
    if (!usable(temperatureC) || !usable(relativeHumidity)) return null;
    if (relativeHumidity < 1 || relativeHumidity > 100) return null;
    if (temperatureC <= -DEWPOINT_B) return null;

    const alpha =
        Math.log(relativeHumidity / 100) + (MAGNUS_A * temperatureC) / (DEWPOINT_B + temperatureC);

    return (DEWPOINT_B * alpha) / (MAGNUS_A - alpha);
}

/**
 * Degrees of air temperature between now and condensation.
 *
 * A small margin means free water on the leaf overnight, which is how a
 * Botrytis outbreak starts. Growers heat, or vent, on this number.
 */
export function condensationMargin(
    temperatureC: number,
    relativeHumidity: number
): number | null {
    const td = dewPoint(temperatureC, relativeHumidity);
    if (td === null) return null;

    return temperatureC - td;
}
