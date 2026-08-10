/**
 * ROI arithmetic for the three engine calculators (spec §4.4).
 *
 * Every function here is pure and unit-tested — spec §7.7 requires tests on
 * any logic that produces a money figure, because these numbers are what a
 * prospect carries into a WhatsApp conversation.
 *
 * Each result is a band (conservative → optimistic) rather than a single
 * number. Quoting one figure to the dollar would be the kind of unbacked
 * precision the brand voice forbids.
 */

/** Weeks per month, averaged over a year (52 / 12). */
const WEEKS_PER_MONTH = 52 / 12;

export interface Band {
    /** Conservative end. */
    low: number;
    /** Optimistic end. */
    high: number;
}

export interface RoiResult {
    monthly: Band;
    annual: Band;
    /** Recurring cost of the service, where one is published. */
    monthlyCost?: number;
    /** Monthly saving net of that cost. */
    net?: Band;
    /** Months to recover the up-front investment, where one applies. */
    paybackMonths?: Band;
}

const band = (low: number, high: number): Band => ({ low, high });
const scaleBand = (b: Band, factor: number): Band => band(b.low * factor, b.high * factor);

/** Guards against NaN, Infinity and negatives from free-text number inputs. */
export function sanitize(value: unknown): number {
    const n = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
    return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Clamps a percentage input to 0–100 and returns it as a 0–1 fraction. */
export function toFraction(percent: unknown): number {
    const n = typeof percent === 'number' ? percent : Number.parseFloat(String(percent ?? ''));
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.min(n, 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// Assumptions
//
// These drive every figure shown to a prospect. They are stated here, in one
// place, so they can be argued with — which is the point.
// ─────────────────────────────────────────────────────────────────────────────

export const ENERGY_ASSUMPTIONS = {
    /** Share of an unmonitored industrial bill that is typically recoverable. */
    savingsLow: 0.08,
    savingsHigh: 0.12,
    /**
     * Share of a power-factor penalty that disappears once a capacitor bank is
     * correctly sized. Not 100% at the low end: some plants keep drifting.
     */
    pfRecoveryLow: 0.8,
    pfRecoveryHigh: 1.0,
    /**
     * When the visitor knows they are penalised but not by how much, assume the
     * penalty is this share of the bill. Ecuadorian tariffs penalise on a
     * sliding scale; ~7% is a common mid-case.
     */
    assumedPfShareOfBill: 0.07,
    /** Diesel burn of a 100–150 kVA genset at partial load. */
    gensetGallonsPerHour: 5,
    /**
     * Share of genset hours avoidable through demand management alone (peak
     * shaving and scheduling), before any generation change.
     */
    gensetAvoidableLow: 0.25,
    gensetAvoidableHigh: 0.4,
} as const;

export const AGENT_ASSUMPTIONS = {
    /** Share of currently-missed conversations an always-on agent recovers. */
    recoveryLow: 0.6,
    recoveryHigh: 0.85,
} as const;

export const FLEET_ASSUMPTIONS = {
    savingsLow: 0.08,
    savingsHigh: 0.12,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Energy
// ─────────────────────────────────────────────────────────────────────────────

export interface EnergyInput {
    /** Total monthly electricity bill in USD. */
    monthlyBill: number;
    /** Whether the utility applies a power-factor penalty. */
    powerFactorPenalty: 'yes' | 'no' | 'unknown';
    /** The penalty in USD/month, when the visitor knows it. */
    penaltyAmount?: number;
    /** Generator run hours per month. */
    gensetHours: number;
    /** USD per gallon of diesel. */
    fuelPricePerGallon: number;
    /** Indicative cost of the monitoring system, for payback. */
    systemInvestment: number;
}

export function calculateEnergy(input: EnergyInput): RoiResult {
    const a = ENERGY_ASSUMPTIONS;

    const bill = sanitize(input.monthlyBill);
    const gensetHours = sanitize(input.gensetHours);
    const fuelPrice = sanitize(input.fuelPricePerGallon);

    // 1. Consumption savings from visibility and demand management.
    const consumption = band(bill * a.savingsLow, bill * a.savingsHigh);

    // 2. Power-factor penalty recovered.
    const pf = powerFactorGains(bill, input.powerFactorPenalty, input.penaltyAmount);

    // 3. Diesel avoided.
    const genset = gensetGains(gensetHours, fuelPrice);

    return assemble(
        band(
            consumption.low + pf.low + genset.low,
            consumption.high + pf.high + genset.high
        ),
        input.systemInvestment
    );
}

function powerFactorGains(
    bill: number,
    penalised: EnergyInput['powerFactorPenalty'],
    statedAmount: number | undefined
): Band {
    const a = ENERGY_ASSUMPTIONS;

    if (penalised === 'no') return band(0, 0);

    if (penalised === 'unknown') {
        // No evidence of a penalty, so the conservative end claims nothing;
        // only the optimistic end carries the tariff-typical share.
        return band(0, bill * a.assumedPfShareOfBill * a.pfRecoveryHigh);
    }

    // Stated penalty, falling back to the tariff-typical share when the
    // visitor knows they are penalised but not by how much.
    const penalty = sanitize(statedAmount) || bill * a.assumedPfShareOfBill;
    return band(penalty * a.pfRecoveryLow, penalty * a.pfRecoveryHigh);
}

/** Diesel avoided by not running the genset during shavable peaks. */
function gensetGains(hours: number, fuelPrice: number): Band {
    const a = ENERGY_ASSUMPTIONS;
    const monthlyDieselCost = hours * a.gensetGallonsPerHour * fuelPrice;
    return band(monthlyDieselCost * a.gensetAvoidableLow, monthlyDieselCost * a.gensetAvoidableHigh);
}

function assemble(monthly: Band, investment: number): RoiResult {
    const annual = scaleBand(monthly, 12);
    const inv = sanitize(investment);

    // Payback inverts the band: the *optimistic* saving pays back *soonest*.
    const paybackMonths =
        inv > 0 && monthly.low > 0 && monthly.high > 0
            ? band(inv / monthly.high, inv / monthly.low)
            : undefined;

    return { monthly, annual, paybackMonths };
}

// ─────────────────────────────────────────────────────────────────────────────
// Agents
// ─────────────────────────────────────────────────────────────────────────────

export interface AgentInput {
    /** Inbound conversations per week across all channels. */
    chatsPerWeek: number;
    /** Percentage going unanswered or answered too late (0–100). */
    unansweredPercent: number;
    /** Average order value in USD. */
    averageTicket: number;
    /** Close rate on conversations that *are* answered (0–100). */
    closeRatePercent: number;
    /** Published monthly price of the agent. */
    monthlyCost: number;
}

export function calculateAgents(input: AgentInput): RoiResult {
    const a = AGENT_ASSUMPTIONS;

    const chats = sanitize(input.chatsPerWeek);
    const unanswered = toFraction(input.unansweredPercent);
    const ticket = sanitize(input.averageTicket);
    const closeRate = toFraction(input.closeRatePercent);

    const missedPerMonth = chats * WEEKS_PER_MONTH * unanswered;

    // Recovered conversations close at the same rate as answered ones.
    const revenuePerRecovered = ticket * closeRate;
    const monthly = band(
        missedPerMonth * a.recoveryLow * revenuePerRecovered,
        missedPerMonth * a.recoveryHigh * revenuePerRecovered
    );

    const cost = sanitize(input.monthlyCost);

    return {
        monthly,
        annual: scaleBand(monthly, 12),
        monthlyCost: cost,
        // Net can legitimately be negative — a small operation may not clear
        // the subscription, and the calculator must say so rather than hide it.
        net: band(monthly.low - cost, monthly.high - cost),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Fleet
// ─────────────────────────────────────────────────────────────────────────────

export interface FleetInput {
    vehicles: number;
    gallonsPerMonth: number;
    pricePerGallon: number;
    /** Indicative monthly price per vehicle. */
    costPerVehicle: number;
}

export function calculateFleet(input: FleetInput): RoiResult {
    const a = FLEET_ASSUMPTIONS;

    const vehicles = sanitize(input.vehicles);
    const gallons = sanitize(input.gallonsPerMonth);
    const price = sanitize(input.pricePerGallon);

    const monthlySpend = gallons * price;
    const monthly = band(monthlySpend * a.savingsLow, monthlySpend * a.savingsHigh);

    const cost = vehicles * sanitize(input.costPerVehicle);

    return {
        monthly,
        annual: scaleBand(monthly, 12),
        monthlyCost: cost,
        net: band(monthly.low - cost, monthly.high - cost),
    };
}
