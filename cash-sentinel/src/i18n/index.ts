import { en } from './en';
import { es, type Dictionary } from './es';
import { ru } from './ru';
import {
    DEFAULT_LOCALE,
    LOCALES,
    LOCALE_META,
    isLocale,
    type Locale,
    type LocaleMeta,
    type Translated,
} from './locales';

export { DEFAULT_LOCALE, LOCALES, LOCALE_META, isLocale };
export type { Dictionary, Locale, LocaleMeta, Translated };

export const DICTIONARIES: Record<Locale, Translated<Dictionary>> = { es, en, ru };

/**
 * Every string the interface can render.
 *
 * Because this is `keyof Dictionary` rather than `string`, a typo in a call
 * site is a build error. The old helper took a `string` and fell back to
 * returning the key itself, so `t('recipientGet')` rendered the literal text
 * "recipientGet" to a customer and nothing anywhere complained.
 */
export type TranslationKey = keyof Dictionary;

export type TranslationParams = Record<string, string | number>;

/**
 * Fills `{placeholders}`.
 *
 * An unknown placeholder is left as written rather than replaced with
 * "undefined", so a mistake shows up as an obviously-unfilled slot instead of
 * a sentence claiming the recipient gets undefined roubles.
 */
export function interpolate(template: string, params?: TranslationParams): string {
    if (!params) return template;

    return template.replace(/\{(\w+)\}/g, (match, key: string) => {
        const value = params[key];
        return value === undefined ? match : String(value);
    });
}

export type Translate = (key: TranslationKey, params?: TranslationParams) => string;

export function createTranslator(locale: Locale): Translate {
    const dictionary = DICTIONARIES[locale];
    return (key, params) => interpolate(dictionary[key], params);
}

const STORAGE_KEY = 'cash-sentinel.locale';

/**
 * Which language to open in.
 *
 * A returning visitor keeps their choice; a new one gets their browser's
 * language if we speak it. Spanish otherwise — the corridor's home language,
 * and what the page has always defaulted to.
 */
export function initialLocale(): Locale {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (isLocale(stored)) return stored;
    } catch {
        // Private browsing and blocked storage both throw here. Not knowing
        // the preference is not a reason to fail to render a page.
    }

    for (const candidate of window.navigator.languages ?? []) {
        const base = candidate.split('-')[0];
        if (isLocale(base)) return base;
    }

    return DEFAULT_LOCALE;
}

export function rememberLocale(locale: Locale): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
        // See above.
    }
}
