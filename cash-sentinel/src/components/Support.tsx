import { Mail, MessageCircle } from 'lucide-react';

import { WHATSAPP_DISPLAY, mailtoUrl, whatsappUrl } from '../config';
import type { Translate } from '../i18n';

export interface SupportProps {
    t: Translate;
}

/**
 * How to reach a person.
 *
 * This replaces `SocialLinks`, which offered four buttons: WhatsApp pointing
 * at the placeholder number (see src/config.ts), and Instagram, Facebook and
 * TikTok all pointing at `#`. None of the four went anywhere. Rather than keep
 * three placeholder icons that scroll the page to the top when a customer
 * with a problem clicks them, this shows the two channels that exist and are
 * answered. The social buttons come back when there are accounts to link.
 */
export function Support({ t }: SupportProps) {
    return (
        <section
            id="soporte"
            aria-labelledby="soporte-title"
            className="panel flex scroll-mt-24 flex-col items-start justify-between gap-6 p-7 md:flex-row md:items-center"
        >
            <div>
                <h2 id="soporte-title" className="text-xl font-semibold">
                    {t('needHelp')}
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-steel">
                    {t('supportDesc')}
                </p>
            </div>

            <div className="flex flex-wrap gap-3">
                <a
                    href={whatsappUrl(t('waSupportMessage'))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 items-center gap-2 rounded-xl px-5 font-semibold text-navy-900 transition-transform duration-150 ease-out-expo hover:scale-[1.02]"
                    style={{ backgroundColor: 'var(--color-ok)' }}
                >
                    <MessageCircle aria-hidden="true" className="size-5" />
                    {t('contactSupport')}
                    <span className="sr-only"> — {WHATSAPP_DISPLAY}</span>
                </a>

                <a
                    href={mailtoUrl('Cash Sentinel')}
                    className="panel-raised flex min-h-11 items-center gap-2 px-5 font-semibold transition-colors duration-150 hover:border-brand"
                >
                    <Mail aria-hidden="true" className="size-5" />
                    {t('contactByEmail')}
                </a>
            </div>
        </section>
    );
}
