/**
 * Single source of truth for anything that appears in more than one place.
 *
 * v1 hardcoded the WhatsApp number in four separate components — two of them
 * with a prefilled message and two without. Everything outward-facing lives
 * here now.
 */

export const SITE = {
    domain: 'www.cognitexindustrial.com',
    url: 'https://www.cognitexindustrial.com',
    name: 'Cognitex Industrial',
    legalName: 'Cognitex Industrial',
    email: 'contact@cognitexindustrial.com',
    city: 'Quito',
    region: 'Pichincha',
    country: 'EC',
    countryName: 'Ecuador',
    /** Geo coordinates for Quito — used by LocalBusiness schema and the map. */
    geo: { lat: -0.1807, lng: -78.4678 },
} as const;

/** E.164 without the +, the format wa.me expects. */
export const WHATSAPP_NUMBER = '593996432010';

/**
 * Builds a wa.me deep link with a prefilled message.
 * Calculators pass their inputs and result so the sales agent picks up the
 * conversation already knowing the numbers.
 */
export function whatsappLink(message?: string): string {
    const base = `https://wa.me/${WHATSAPP_NUMBER}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** The three revenue engines. Order is load-bearing: it drives the nav. */
export const ENGINES = [
    {
        id: 'energia',
        path: '/energia',
        enPath: '/en/energy',
        accent: 'var(--color-amber-warn)',
    },
    {
        id: 'agentes',
        path: '/agentes',
        enPath: '/en/agents',
        accent: 'var(--color-cyan-electric)',
    },
    {
        id: 'flotas',
        path: '/flotas',
        enPath: '/en/fleets',
        accent: 'var(--color-green-ok)',
    },
] as const;

export type EngineId = (typeof ENGINES)[number]['id'];

/**
 * The Sentinel consoles, in the order they appear on the site.
 *
 * `url` is null when the platform has nowhere to send a visitor yet. The UI
 * renders those as "coming soon" rather than a dead link — the brand voice
 * does not allow advertising something that does not answer.
 *
 * Verified against DNS and HTTP on 2026-08-10:
 *  · agro / industry / personal → subdomain, 200
 *  · transport                  → subdomain (Cloud Run mapping), 200
 *  · productivity               → deployed to Cloud Run, NO subdomain yet
 *  · cash                       → not deployed at all (no workflow exists)
 */
export const PLATFORMS = [
    {
        id: 'industry',
        name: 'Industry Sentinel',
        url: 'https://industry.cognitexindustrial.com',
        accent: 'var(--color-cyan-electric)',
    },
    {
        id: 'personal',
        name: 'Personal Sentinel',
        url: 'https://personal.cognitexindustrial.com',
        accent: 'var(--color-amber-warn)',
    },
    {
        id: 'agro',
        name: 'Agro Sentinel',
        url: 'https://agro.cognitexindustrial.com',
        accent: 'var(--color-green-ok)',
    },
    {
        id: 'transport',
        name: 'Transport Sentinel',
        url: 'https://transport.cognitexindustrial.com',
        accent: 'var(--color-cyan-600)',
    },
    {
        id: 'productivity',
        name: 'Productivity Sentinel',
        // Live on Cloud Run but with no subdomain. Point this at
        // productivity.cognitexindustrial.com once the DNS record exists.
        url: 'https://productivity-sentinel-myvq6twbpa-uk.a.run.app',
        accent: 'var(--color-steel)',
    },
    {
        id: 'cash',
        name: 'Cash Sentinel',
        // No deployment pipeline exists for this project yet.
        url: null,
        accent: 'var(--color-steel)',
    },
] as const;

export type PlatformId = (typeof PLATFORMS)[number]['id'];

/**
 * Published pricing. The chat guardrails (spec §4.5) forbid quoting any
 * figure that is not in this catalogue.
 *
 * ⚠ Only `agentsMonthly` comes from the spec (§4.4). `fleetPerVehicleMonthly`
 * and `energySystemInvestment` are placeholders needed to render the "net of
 * cost" and "payback" figures the spec asks for — the spec never states them.
 * CONFIRM BOTH WITH THE FOUNDER before this goes live: they appear in the
 * calculator output and in the WhatsApp message a prospect receives.
 */
export const PRICING = {
    agentsMonthly: 490,
    /** PLACEHOLDER — unconfirmed. */
    fleetPerVehicleMonthly: 18,
    /** PLACEHOLDER — unconfirmed. Indicative cost of the monitoring system. */
    energySystemInvestment: 4800,
    currency: 'USD',
} as const;

/** Defaults for the ROI calculators — Ecuador, 2026. */
export const ASSUMPTIONS = {
    /** USD per gallon of diesel. */
    fuelPricePerGallon: 3.1,
    /** Conservative and optimistic ends of the savings band we commit to. */
    savingsBandLow: 0.08,
    savingsBandHigh: 0.12,
} as const;
