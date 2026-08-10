import { LOCALES, LOCALE_META, type Locale, type Translate } from '../i18n';

export interface LanguageSwitcherProps {
    locale: Locale;
    onChange: (next: Locale) => void;
    t: Translate;
}

/**
 * ES / EN / RU.
 *
 * The buttons carry `aria-pressed` and the language's own name, so the state
 * is not conveyed by background colour alone — the old version's only signal
 * that Russian was active was a white pill behind two grey letters.
 */
export function LanguageSwitcher({ locale, onChange, t }: LanguageSwitcherProps) {
    return (
        <div
            role="group"
            aria-label={t('languageSwitcherLabel')}
            className="flex items-center gap-1 rounded-lg bg-navy-800 p-1"
        >
            {LOCALES.map((candidate) => {
                const meta = LOCALE_META[candidate];
                const active = candidate === locale;

                return (
                    <button
                        key={candidate}
                        type="button"
                        lang={meta.htmlLang}
                        aria-pressed={active}
                        onClick={() => onChange(candidate)}
                        className="min-h-11 rounded-md px-3 text-sm font-semibold transition-colors duration-150"
                        style={
                            active
                                ? { backgroundColor: 'var(--color-brand)', color: 'var(--color-navy-900)' }
                                : { color: 'var(--color-steel)' }
                        }
                    >
                        {meta.label}
                        <span className="sr-only"> — {meta.endonym}</span>
                    </button>
                );
            })}
        </div>
    );
}
