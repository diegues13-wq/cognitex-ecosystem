import { es } from './es';
import { en } from './en';

export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'es';

const DICTIONARIES = { es, en };

export function useTranslations(locale: Locale) {
    return DICTIONARIES[locale];
}

/**
 * Every page, keyed by a stable id, with its path in each locale.
 *
 * Paths are localised rather than prefixed (`/energia` ↔ `/en/energy`) so both
 * locales get keyword-bearing URLs. This map is what makes the hreflang pairs
 * in Seo.astro correct — v1 had no English URL at all, so English was
 * unreachable to search engines.
 */
export const ROUTES = {
    home: { es: '/', en: '/en/' },
    energia: { es: '/energia', en: '/en/energy' },
    agentes: { es: '/agentes', en: '/en/agents' },
    flotas: { es: '/flotas', en: '/en/fleets' },
    demo: { es: '/demo-viva', en: '/en/live-demo' },
    casos: { es: '/casos', en: '/en/cases' },
    nosotros: { es: '/nosotros', en: '/en/about' },
    contacto: { es: '/contacto', en: '/en/contact' },
    privacidad: { es: '/legal/privacidad', en: '/en/legal/privacy' },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteId = keyof typeof ROUTES;

/** Path for a page in a given locale. */
export function route(id: RouteId, locale: Locale): string {
    return ROUTES[id][locale];
}

/** The same page in the other locale — powers the language toggle. */
export function alternateRoute(id: RouteId, current: Locale): string {
    return ROUTES[id][current === 'es' ? 'en' : 'es'];
}

/** Reads the locale off a URL. Anything under /en/ is English. */
export function localeFromUrl(url: URL): Locale {
    return url.pathname === '/en' || url.pathname.startsWith('/en/') ? 'en' : 'es';
}

/** Formats a whole-dollar amount the way both locales expect. */
export function formatUsd(value: number, locale: Locale): string {
    return new Intl.NumberFormat(locale === 'es' ? 'es-EC' : 'en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(value);
}
