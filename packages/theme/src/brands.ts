/**
 * Per-platform identity.
 *
 * One accent, one icon, one tagline per app — declared here so a designer can
 * see the whole family at once, and so nothing drifts. Previously the theme
 * lived in ad-hoc utility classes: personal-sentinel's Tailwind config shipped
 * industry's cyan while its UI was orange, so `selection:bg-cognitex` rendered
 * cyan in an orange app.
 *
 * `accent` becomes `--color-brand`; everything else in the design system is
 * identical across platforms.
 */

export type PlatformId =
    | 'agro'
    | 'cash'
    | 'industry'
    | 'personal'
    | 'productivity'
    | 'transport';

export interface Brand {
    id: PlatformId;
    /** Product name as shown in the sidebar and login. */
    name: string;
    /** One line under the name. No superlatives without a figure. */
    tagline: string;
    /** Drives --color-brand. */
    accent: string;
    accentDim: string;
    /** lucide-react icon name, resolved by the app to avoid bundling all icons. */
    icon: string;
    /** Public console URL, or null when it is not deployed yet. */
    url: string | null;
}

export const BRANDS: Record<PlatformId, Brand> = {
    industry: {
        id: 'industry',
        name: 'Industry Sentinel',
        tagline: 'Manufactura y mantenimiento predictivo',
        accent: '#00e5ff',
        accentDim: '#00b4d8',
        icon: 'Factory',
        url: 'https://industry.cognitexindustrial.com',
    },
    personal: {
        id: 'personal',
        name: 'Personal Sentinel',
        tagline: 'Seguridad laboral y cumplimiento de EPP',
        accent: '#ffb830',
        accentDim: '#d9971f',
        icon: 'ShieldAlert',
        url: 'https://personal.cognitexindustrial.com',
    },
    agro: {
        id: 'agro',
        name: 'Agro Sentinel',
        tagline: 'Invernadero y análisis térmico',
        accent: '#00c896',
        accentDim: '#00a67c',
        icon: 'Sprout',
        url: 'https://agro.cognitexindustrial.com',
    },
    transport: {
        id: 'transport',
        name: 'Transport Sentinel',
        tagline: 'Operación ferroviaria y RAMS',
        accent: '#38a8e0',
        accentDim: '#1d6fa5',
        icon: 'Train',
        url: 'https://transport.cognitexindustrial.com',
    },
    productivity: {
        id: 'productivity',
        name: 'Productivity Sentinel',
        tagline: 'Restricciones y cumplimiento semanal',
        accent: '#a855f7',
        accentDim: '#7c3aed',
        icon: 'TrendingUp',
        // Deployed to Cloud Run but still without a subdomain.
        url: 'https://productivity-sentinel-myvq6twbpa-uk.a.run.app',
    },
    cash: {
        id: 'cash',
        name: 'Cash Sentinel',
        tagline: 'Divisas, remesas y transferencias',
        accent: '#3b82f6',
        accentDim: '#2563eb',
        icon: 'Landmark',
        /*
         * Still null, deliberately.
         *
         * `deploy-cash.yaml` now exists, but it has never run — the workflow
         * lands with this branch and the service does not exist yet. Fill this
         * in from the URL the first successful deploy prints, not from the
         * pattern the other services follow: Cloud Run's `status.url` reports
         * a form that does not route for recently created services.
         */
        url: null,
    },
};

/** Inline style that switches the whole design system to a platform's accent. */
export function brandVars(brand: Brand): Record<string, string> {
    return {
        '--color-brand': brand.accent,
        '--color-brand-dim': brand.accentDim,
    };
}
