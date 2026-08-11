import { describe, expect, it } from 'vitest';

import {
    actualVapourPressure,
    condensationMargin,
    dewPoint,
    saturationVapourPressure,
    vapourPressureDeficit,
} from './psychrometrics';

/**
 * Checked against published values, not against the implementation.
 *
 * Saturation vapour pressure comes from FAO Irrigation and Drainage Paper 56,
 * Annex 2, Table 2.3 (Allen et al., 1998), which tabulates e°(T) in kPa for
 * every 0.1 °C. Dew points come from the standard psychrometric tables and
 * agree with Lawrence (2005) Table 1 to a tenth of a degree.
 *
 * A tolerance of 0.001 kPa is tighter than any greenhouse sensor: a good
 * capacitive RH probe is ±2% RH, which at 25 °C is ±0.06 kPa of VPD. The
 * point of the tight tolerance is that it fails if someone edits a constant.
 */

describe('saturationVapourPressure', () => {
    it('matches FAO-56 Table 2.3 at 0, 20, 25 and 30 °C', () => {
        expect(saturationVapourPressure(0)).toBeCloseTo(0.611, 3);
        expect(saturationVapourPressure(20)).toBeCloseTo(2.338, 3);
        expect(saturationVapourPressure(25)).toBeCloseTo(3.168, 3);
        expect(saturationVapourPressure(30)).toBeCloseTo(4.243, 3);
    });

    it('is monotonic in temperature', () => {
        const curve = [5, 10, 15, 20, 25, 30, 35].map((t) => saturationVapourPressure(t)!);
        const sorted = [...curve].sort((a, b) => a - b);

        expect(curve).toEqual(sorted);
    });

    it('returns a value at exactly 0 °C rather than treating it as missing', () => {
        // cloud/main.py:181 guards its call with `if temp and humidity`, so a
        // reading of exactly 0.0 °C silently produces no VPD and no dew point.
        // Cayambe sits at 2 830 m; 0 °C is a night, not a fault.
        expect(saturationVapourPressure(0)).not.toBeNull();
        expect(vapourPressureDeficit(0, 80)).toBeCloseTo(0.12216, 4);
    });

    it('rejects unusable input instead of returning NaN', () => {
        expect(saturationVapourPressure(Number.NaN)).toBeNull();
        expect(saturationVapourPressure(Number.POSITIVE_INFINITY)).toBeNull();
        expect(saturationVapourPressure(-300)).toBeNull();
    });
});

describe('actualVapourPressure', () => {
    it('is the saturation pressure scaled by relative humidity', () => {
        // FAO-56 eq. 19: e_a = e°(T) · RH/100 → 3.168 × 0.60 = 1.901 kPa.
        expect(actualVapourPressure(25, 60)).toBeCloseTo(1.9006, 4);
    });

    it('equals the saturation pressure at 100% RH', () => {
        expect(actualVapourPressure(20, 100)).toBeCloseTo(2.338, 3);
    });

    it('rejects a humidity outside 0–100%', () => {
        expect(actualVapourPressure(20, 140)).toBeNull();
        expect(actualVapourPressure(20, -5)).toBeNull();
    });
});

describe('vapourPressureDeficit', () => {
    it('matches the published VPD chart at 25 °C and 60% RH', () => {
        // e°(25) = 3.168 kPa, so VPD = 3.168 × 0.40 = 1.267 kPa. Grower VPD
        // charts print 1.27 kPa for this cell.
        expect(vapourPressureDeficit(25, 60)).toBeCloseTo(1.26707, 4);
    });

    it('matches the chart across the range a greenhouse actually runs at', () => {
        // 0.70 kPa, 0.85 kPa and 0.85 kPa on a printed grower VPD chart.
        expect(vapourPressureDeficit(20, 70)).toBeCloseTo(0.70146, 4);
        expect(vapourPressureDeficit(30, 80)).toBeCloseTo(0.84859, 4);
        expect(vapourPressureDeficit(15, 50)).toBeCloseTo(0.85264, 4);
    });

    it('is exactly zero at saturation, never a negative epsilon', () => {
        const vpd = vapourPressureDeficit(22, 100);

        expect(vpd).toBe(0);
        // Object.is distinguishes -0, which would render as "-0.00 kPa".
        expect(Object.is(vpd, -0)).toBe(false);
    });

    it('rises with temperature at constant humidity', () => {
        const cool = vapourPressureDeficit(18, 70)!;
        const warm = vapourPressureDeficit(28, 70)!;

        expect(warm).toBeGreaterThan(cool);
    });

    it('falls with humidity at constant temperature', () => {
        const dry = vapourPressureDeficit(24, 40)!;
        const humid = vapourPressureDeficit(24, 90)!;

        expect(humid).toBeLessThan(dry);
    });

    it('returns null for a missing humidity rather than a plausible number', () => {
        expect(vapourPressureDeficit(24, Number.NaN)).toBeNull();
    });
});

describe('dewPoint', () => {
    it('matches the psychrometric table at 20 °C and 50% RH', () => {
        // Published value 9.3 °C.
        expect(dewPoint(20, 50)).toBeCloseTo(9.2543, 3);
    });

    it('matches the table at 30 °C and 80% RH', () => {
        // Published value 26.2 °C.
        expect(dewPoint(30, 80)).toBeCloseTo(26.1604, 3);
    });

    it('equals the air temperature at saturation', () => {
        expect(dewPoint(20, 100)).toBeCloseTo(20, 3);
        expect(dewPoint(5, 100)).toBeCloseTo(5, 3);
    });

    it('is always at or below the air temperature', () => {
        for (const rh of [10, 30, 55, 80, 99, 100]) {
            expect(dewPoint(24, rh)!).toBeLessThanOrEqual(24 + 1e-9);
        }
    });

    it('goes below freezing in dry highland air', () => {
        // Cayambe, 12 °C at 20% RH.
        expect(dewPoint(12, 20)).toBeCloseTo(-10.2653, 3);
    });

    it('refuses humidity below 1%, where the logarithm runs away', () => {
        expect(dewPoint(20, 0)).toBeNull();
        expect(dewPoint(20, 0.4)).toBeNull();
    });
});

describe('condensationMargin', () => {
    it('is zero when the air is saturated and free water forms', () => {
        expect(condensationMargin(18, 100)).toBeCloseTo(0, 3);
    });

    it('is the gap between air temperature and dew point', () => {
        expect(condensationMargin(20, 50)).toBeCloseTo(20 - 9.2543, 3);
    });

    it('is null when the dew point cannot be computed', () => {
        expect(condensationMargin(20, 0)).toBeNull();
    });
});
