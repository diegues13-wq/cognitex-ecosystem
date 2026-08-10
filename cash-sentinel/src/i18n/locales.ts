/**
 * The three languages the page is actually used in.
 *
 * Spanish first: the calculator serves the Ecuador–Russia corridor and the
 * app has always opened in Spanish. The document previously declared
 * `lang="en"` in index.html and never changed it, so every screen reader
 * pronounced the Spanish copy with English phonetics and Google indexed the
 * page as English. The attribute follows the selected locale now.
 */

export type Locale = 'es' | 'en' | 'ru';

export const DEFAULT_LOCALE: Locale = 'es';

export const LOCALES = ['es', 'en', 'ru'] as const satisfies readonly Locale[];

export interface LocaleMeta {
    /** What goes on the switcher button. */
    label: string;
    /** The language's own name, for the button's accessible label. */
    endonym: string;
    /** Goes into <html lang>. */
    htmlLang: string;
    /** BCP-47 tag used for number formatting. */
    numberLocale: string;
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
    es: { label: 'ES', endonym: 'Español', htmlLang: 'es', numberLocale: 'es-EC' },
    en: { label: 'EN', endonym: 'English', htmlLang: 'en', numberLocale: 'en-US' },
    ru: { label: 'RU', endonym: 'Русский', htmlLang: 'ru', numberLocale: 'ru-RU' },
};

/**
 * Maps a dictionary to "the same keys, all strings".
 *
 * One dictionary is the source of truth for the key set; the others are
 * declared as `Translated<Dictionary>`, so forgetting a key — or inventing
 * one that no other language has — is a build error rather than a `key` string
 * rendered raw into the interface, which is what the old
 * `translations[lang][key] || key` fallback did.
 */
export type Translated<D> = { readonly [K in keyof D]: string };

export function isLocale(value: unknown): value is Locale {
    return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}
