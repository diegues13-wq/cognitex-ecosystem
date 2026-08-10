import type { Translate } from '../i18n';

export interface HowItWorksProps {
    t: Translate;
}

/**
 * Three steps.
 *
 * This section exists because the header already linked to `#como-funciona`
 * and nothing on the page carried that id, so "¿Cómo funciona?" scrolled
 * nowhere in all three languages. Either the link or the section had to go;
 * on a page asking strangers to send money abroad, the section is the one
 * worth keeping.
 */
export function HowItWorks({ t }: HowItWorksProps) {
    const steps = [
        { title: t('step1Title'), body: t('step1Desc') },
        { title: t('step2Title'), body: t('step2Desc') },
        { title: t('step3Title'), body: t('step3Desc') },
    ];

    return (
        <section id="como-funciona" aria-labelledby="como-funciona-title" className="scroll-mt-24">
            <h2 id="como-funciona-title" className="text-2xl font-semibold">
                {t('howItWorksTitle')}
            </h2>

            <ol className="mt-6 grid gap-4 sm:grid-cols-3">
                {steps.map((step, index) => (
                    <li key={step.title} className="panel p-5">
                        <span
                            aria-hidden="true"
                            className="label-mono block"
                            style={{ color: 'var(--color-brand)' }}
                        >
                            {String(index + 1).padStart(2, '0')}
                        </span>
                        <h3 className="mt-2 text-base font-semibold">{step.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-steel">{step.body}</p>
                    </li>
                ))}
            </ol>
        </section>
    );
}
