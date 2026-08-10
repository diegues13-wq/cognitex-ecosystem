import { CheckCircle2, Gauge, ShieldCheck } from 'lucide-react';

import type { Translate } from '../i18n';

export interface HeroProps {
    t: Translate;
}

/**
 * The marketing half of the page.
 *
 * The two feature cards used to be translucent white over a blurred backdrop.
 * They are solid panels here, and not as a style preference: blurring what is
 * behind an element routes through an AVX2 path in Skia that raised SIGILL on
 * pre-Haswell machines and crashed transport-sentinel in the field. See
 * packages/README.md.
 *
 * (The utility class is not named in this comment on purpose — Tailwind v4
 * scans source files as plain text, so writing it here would emit the rule
 * into the stylesheet even though nothing uses it.)
 */
export function Hero({ t }: HeroProps) {
    return (
        <div className="animate-rise flex flex-col gap-7">
            <h1 className="text-4xl leading-tight font-semibold sm:text-5xl lg:text-6xl">
                {t('sendMoneyTo')}{' '}
                <span style={{ color: 'var(--color-brand)' }}>{t('russia')}</span>{' '}
                <span className="font-normal text-steel">{t('and')}</span>{' '}
                <span style={{ color: 'var(--color-ok)' }}>{t('ecuador')}</span>
                <br />
                <span className="text-2xl text-ice/85 sm:text-3xl">{t('fastAndSecure')}</span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-steel">{t('heroSubtitle')}</p>

            <div className="grid gap-4 sm:grid-cols-2">
                <article className="panel flex items-start gap-4 p-5">
                    <Gauge
                        aria-hidden="true"
                        className="size-7 shrink-0"
                        style={{ color: 'var(--color-brand)' }}
                    />
                    <div>
                        <h2 className="text-base font-semibold">{t('liveUpdate')}</h2>
                        <p className="mt-1 text-sm leading-relaxed text-steel">
                            {t('liveUpdateDesc')}
                        </p>
                    </div>
                </article>

                <article className="panel flex items-start gap-4 p-5">
                    <ShieldCheck
                        aria-hidden="true"
                        className="size-7 shrink-0"
                        style={{ color: 'var(--color-ok)' }}
                    />
                    <div>
                        <h2 className="text-base font-semibold">{t('secure100')}</h2>
                        <p className="mt-1 text-sm leading-relaxed text-steel">
                            {t('secure100Desc')}
                        </p>
                    </div>
                </article>
            </div>

            <ul className="flex flex-col gap-3">
                {[t('lowCommission'), t('whatsappSupport')].map((claim) => (
                    <li key={claim} className="flex items-center gap-3 text-ice/90">
                        <CheckCircle2
                            aria-hidden="true"
                            className="size-5 shrink-0"
                            style={{ color: 'var(--color-ok)' }}
                        />
                        {claim}
                    </li>
                ))}
            </ul>
        </div>
    );
}
