import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Landmark, ShieldCheck } from 'lucide-react';
import { BRANDS, brandVars } from '@cognitex/theme';

import { Calculator } from './components/Calculator';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { Support } from './components/Support';
import { PARENT_SITE } from './config';
import { useExchangeRate } from './data/useExchangeRate';
import {
    LOCALE_META,
    createTranslator,
    initialLocale,
    rememberLocale,
    type Locale,
} from './i18n';

const BRAND = BRANDS.cash;

/**
 * Cash Sentinel — a public exchange and remittance calculator.
 *
 * Deliberately unauthenticated. It is the only Sentinel that is not a console:
 * its job is to answer "how much does my mother receive?" for someone who has
 * never heard of Cognitex, and a login screen in front of that question would
 * remove the reason the page exists.
 */
export function App() {
    const [locale, setLocale] = useState<Locale>(initialLocale);
    const rate = useExchangeRate();
    const t = useMemo(() => createTranslator(locale), [locale]);

    /**
     * The document follows the chosen language. index.html shipped `lang="en"`
     * against Spanish copy, which mispronounces every word in a screen reader
     * and tells search engines the wrong thing about the whole page.
     */
    useEffect(() => {
        document.documentElement.lang = LOCALE_META[locale].htmlLang;
        document.title = t('pageTitle');

        const description = document.querySelector('meta[name="description"]');
        description?.setAttribute('content', t('pageDescription'));
    }, [locale, t]);

    const changeLocale = (next: Locale) => {
        setLocale(next);
        rememberLocale(next);
    };

    return (
        <div
            className="flex min-h-dvh flex-col bg-navy-900 text-ice"
            style={brandVars(BRAND) as CSSProperties}
        >
            <p className="flex items-center justify-center gap-2 bg-navy-deep px-4 py-2 text-center text-xs text-steel">
                <ShieldCheck
                    aria-hidden="true"
                    className="size-4 shrink-0"
                    style={{ color: 'var(--color-ok)' }}
                />
                {t('bannerText')}
            </p>

            <header className="sticky top-0 z-50 border-b border-navy-700 bg-navy-900">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3">
                    <div className="flex items-center gap-3">
                        <span
                            aria-hidden="true"
                            className="flex size-10 items-center justify-center rounded-panel"
                            style={{ backgroundColor: 'var(--color-brand)' }}
                        >
                            <Landmark className="size-5" style={{ color: 'var(--color-navy-900)' }} />
                        </span>
                        <span className="font-display text-lg font-semibold tracking-tight">
                            {BRAND.name}
                        </span>
                    </div>

                    <nav className="flex items-center gap-1 text-sm font-medium">
                        <a
                            href="#como-funciona"
                            className="hidden min-h-11 items-center px-3 text-steel transition-colors duration-150 hover:text-ice md:flex"
                        >
                            {t('howItWorks')}
                        </a>
                        <a
                            href="#soporte"
                            className="hidden min-h-11 items-center px-3 text-steel transition-colors duration-150 hover:text-ice md:flex"
                        >
                            {t('support')}
                        </a>
                        <LanguageSwitcher locale={locale} onChange={changeLocale} t={t} />
                    </nav>
                </div>
            </header>

            <main className="mx-auto w-full max-w-7xl flex-1 px-5 pt-10 pb-20 lg:pt-16">
                <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-8">
                    <div className="lg:col-span-7">
                        <Hero t={t} />
                    </div>

                    <div className="flex justify-center lg:col-span-5 lg:justify-end">
                        <Calculator t={t} locale={locale} rate={rate} />
                    </div>
                </div>

                <p className="mt-8 max-w-3xl text-sm leading-relaxed text-steel">
                    {t('quoteDisclaimer')}
                </p>

                <div className="mt-20">
                    <HowItWorks t={t} />
                </div>

                <div className="mt-16">
                    <Support t={t} />
                </div>
            </main>

            <footer className="border-t border-navy-700 bg-navy-deep px-5 py-10">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-steel md:flex-row">
                    <span className="font-display font-semibold text-ice">{BRAND.name}</span>
                    <div className="text-center md:text-right">
                        <p>
                            © {new Date().getFullYear()} {BRAND.name}. {t('rightsReserved')}
                        </p>
                        <p className="mt-1 text-xs">
                            {t('poweredBy')}{' '}
                            <a
                                href={PARENT_SITE}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline decoration-dotted underline-offset-4 hover:text-ice"
                                style={{ color: 'var(--color-brand)' }}
                            >
                                Cognitex Industrial
                            </a>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
