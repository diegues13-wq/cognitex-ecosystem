import { describe, expect, it } from 'vitest';
import {
    AGENT_ASSUMPTIONS,
    ENERGY_ASSUMPTIONS,
    FLEET_ASSUMPTIONS,
    calculateAgents,
    calculateEnergy,
    calculateFleet,
    sanitize,
    toFraction,
} from './roi';

/**
 * Spec §7.7 requires tests on any logic that produces a money figure.
 * These numbers end up in a WhatsApp message a prospect reads as a promise.
 */

describe('sanitize', () => {
    it('accepts positive numbers and numeric strings', () => {
        expect(sanitize(1200)).toBe(1200);
        expect(sanitize('1200.50')).toBe(1200.5);
    });

    it('collapses anything that is not a usable positive number to 0', () => {
        for (const bad of [0, -5, '', '   ', 'abc', null, undefined, NaN, Infinity, -Infinity]) {
            expect(sanitize(bad)).toBe(0);
        }
    });
});

describe('toFraction', () => {
    it('converts a percentage to a fraction', () => {
        expect(toFraction(30)).toBeCloseTo(0.3);
        expect(toFraction('7.5')).toBeCloseTo(0.075);
    });

    it('clamps above 100 rather than inventing impossible recovery', () => {
        expect(toFraction(250)).toBe(1);
    });

    it('floors invalid or negative input at 0', () => {
        for (const bad of [-10, 'abc', null, undefined, NaN]) {
            expect(toFraction(bad)).toBe(0);
        }
    });
});

describe('calculateEnergy', () => {
    const base = {
        monthlyBill: 4000,
        gensetHours: 0,
        fuelPricePerGallon: 3.1,
        systemInvestment: 0,
    };

    it('applies only the consumption band when there is no penalty or genset', () => {
        const result = calculateEnergy({ ...base, powerFactorPenalty: 'no' });

        expect(result.monthly.low).toBeCloseTo(4000 * ENERGY_ASSUMPTIONS.savingsLow);
        expect(result.monthly.high).toBeCloseTo(4000 * ENERGY_ASSUMPTIONS.savingsHigh);
    });

    it('annualises as twelve months', () => {
        const result = calculateEnergy({ ...base, powerFactorPenalty: 'no' });

        expect(result.annual.low).toBeCloseTo(result.monthly.low * 12);
        expect(result.annual.high).toBeCloseTo(result.monthly.high * 12);
    });

    it('adds the stated power-factor penalty on top of consumption savings', () => {
        const withPenalty = calculateEnergy({
            ...base,
            powerFactorPenalty: 'yes',
            penaltyAmount: 300,
        });
        const without = calculateEnergy({ ...base, powerFactorPenalty: 'no' });

        expect(withPenalty.monthly.low - without.monthly.low).toBeCloseTo(
            300 * ENERGY_ASSUMPTIONS.pfRecoveryLow
        );
        expect(withPenalty.monthly.high - without.monthly.high).toBeCloseTo(
            300 * ENERGY_ASSUMPTIONS.pfRecoveryHigh
        );
    });

    it('falls back to the tariff-typical share when penalised by an unknown amount', () => {
        const result = calculateEnergy({ ...base, powerFactorPenalty: 'yes' });
        const assumed = 4000 * ENERGY_ASSUMPTIONS.assumedPfShareOfBill;
        const without = calculateEnergy({ ...base, powerFactorPenalty: 'no' });

        expect(result.monthly.high - without.monthly.high).toBeCloseTo(
            assumed * ENERGY_ASSUMPTIONS.pfRecoveryHigh
        );
    });

    it('claims nothing at the conservative end when the penalty is unknown', () => {
        const unknown = calculateEnergy({ ...base, powerFactorPenalty: 'unknown' });
        const none = calculateEnergy({ ...base, powerFactorPenalty: 'no' });

        // Conservative end must not promise a recovery we have no evidence for.
        expect(unknown.monthly.low).toBeCloseTo(none.monthly.low);
        expect(unknown.monthly.high).toBeGreaterThan(none.monthly.high);
    });

    it('values avoided diesel at the avoidable share of genset burn', () => {
        const a = ENERGY_ASSUMPTIONS;
        const withGenset = calculateEnergy({
            ...base,
            powerFactorPenalty: 'no',
            gensetHours: 20,
        });
        const without = calculateEnergy({ ...base, powerFactorPenalty: 'no' });

        const dieselCost = 20 * a.gensetGallonsPerHour * 3.1;
        expect(withGenset.monthly.low - without.monthly.low).toBeCloseTo(
            dieselCost * a.gensetAvoidableLow
        );
        expect(withGenset.monthly.high - without.monthly.high).toBeCloseTo(
            dieselCost * a.gensetAvoidableHigh
        );
    });

    it('inverts the band for payback: the best saving pays back soonest', () => {
        const result = calculateEnergy({
            ...base,
            powerFactorPenalty: 'no',
            systemInvestment: 4800,
        });

        expect(result.paybackMonths).toBeDefined();
        // low months  ← high saving, high months ← low saving
        expect(result.paybackMonths!.low).toBeCloseTo(4800 / result.monthly.high);
        expect(result.paybackMonths!.high).toBeCloseTo(4800 / result.monthly.low);
        expect(result.paybackMonths!.low).toBeLessThan(result.paybackMonths!.high);
    });

    it('omits payback when there is no investment or no saving', () => {
        expect(
            calculateEnergy({ ...base, powerFactorPenalty: 'no' }).paybackMonths
        ).toBeUndefined();

        // An empty bill yields no saving, so payback would divide by zero.
        expect(
            calculateEnergy({
                ...base,
                monthlyBill: 0,
                powerFactorPenalty: 'no',
                systemInvestment: 4800,
            }).paybackMonths
        ).toBeUndefined();
    });

    it('returns zeroes rather than NaN for an empty form', () => {
        const result = calculateEnergy({
            monthlyBill: Number.NaN,
            powerFactorPenalty: 'no',
            gensetHours: Number.NaN,
            fuelPricePerGallon: Number.NaN,
            systemInvestment: Number.NaN,
        });

        expect(result.monthly.low).toBe(0);
        expect(result.monthly.high).toBe(0);
        expect(result.annual.high).toBe(0);
    });
});

describe('calculateAgents', () => {
    const base = {
        chatsPerWeek: 100,
        unansweredPercent: 30,
        averageTicket: 200,
        closeRatePercent: 25,
        monthlyCost: 490,
    };

    it('recovers the assumed share of missed conversations', () => {
        const result = calculateAgents(base);

        // 100 chats/wk × 52/12 wks ≈ 433.33/month, 30% missed = 130
        const missed = 100 * (52 / 12) * 0.3;
        const revenuePer = 200 * 0.25;

        expect(result.monthly.low).toBeCloseTo(missed * AGENT_ASSUMPTIONS.recoveryLow * revenuePer);
        expect(result.monthly.high).toBeCloseTo(
            missed * AGENT_ASSUMPTIONS.recoveryHigh * revenuePer
        );
    });

    it('uses 52/12 weeks per month, not a flat 4', () => {
        const result = calculateAgents({ ...base, unansweredPercent: 100 });
        const withFlatFour = 100 * 4 * 1 * (200 * 0.25) * AGENT_ASSUMPTIONS.recoveryLow;

        // The correct figure is ~8% higher than the naive 4-week month.
        expect(result.monthly.low).toBeGreaterThan(withFlatFour);
    });

    it('subtracts the published subscription to give net', () => {
        const result = calculateAgents(base);

        expect(result.monthlyCost).toBe(490);
        expect(result.net!.low).toBeCloseTo(result.monthly.low - 490);
        expect(result.net!.high).toBeCloseTo(result.monthly.high - 490);
    });

    it('reports a negative net honestly for an operation too small to clear the fee', () => {
        const result = calculateAgents({
            ...base,
            chatsPerWeek: 5,
            averageTicket: 20,
        });

        expect(result.net!.low).toBeLessThan(0);
    });

    it('yields nothing when no conversations go unanswered', () => {
        const result = calculateAgents({ ...base, unansweredPercent: 0 });

        expect(result.monthly.low).toBe(0);
        expect(result.monthly.high).toBe(0);
        expect(result.net!.low).toBe(-490);
    });

    it('clamps an over-100% unanswered rate', () => {
        const clamped = calculateAgents({ ...base, unansweredPercent: 400 });
        const full = calculateAgents({ ...base, unansweredPercent: 100 });

        expect(clamped.monthly.high).toBeCloseTo(full.monthly.high);
    });
});

describe('calculateFleet', () => {
    const base = {
        vehicles: 10,
        gallonsPerMonth: 2000,
        pricePerGallon: 3.1,
        costPerVehicle: 18,
    };

    it('recovers the savings band off total fuel spend', () => {
        const result = calculateFleet(base);
        const spend = 2000 * 3.1;

        expect(result.monthly.low).toBeCloseTo(spend * FLEET_ASSUMPTIONS.savingsLow);
        expect(result.monthly.high).toBeCloseTo(spend * FLEET_ASSUMPTIONS.savingsHigh);
    });

    it('prices the subscription per vehicle', () => {
        expect(calculateFleet(base).monthlyCost).toBe(180);
        expect(calculateFleet({ ...base, vehicles: 25 }).monthlyCost).toBe(450);
    });

    it('nets the subscription off the saving', () => {
        const result = calculateFleet(base);

        expect(result.net!.low).toBeCloseTo(result.monthly.low - 180);
        expect(result.net!.high).toBeCloseTo(result.monthly.high - 180);
    });

    it('scales linearly with fuel volume', () => {
        const single = calculateFleet({ ...base, gallonsPerMonth: 1000 });
        const double = calculateFleet({ ...base, gallonsPerMonth: 2000 });

        expect(double.monthly.low).toBeCloseTo(single.monthly.low * 2);
    });

    it('survives an empty form', () => {
        const result = calculateFleet({
            vehicles: 0,
            gallonsPerMonth: 0,
            pricePerGallon: 0,
            costPerVehicle: 18,
        });

        expect(result.monthly.low).toBe(0);
        expect(result.monthlyCost).toBe(0);
        expect(result.net!.low).toBe(0);
    });
});
