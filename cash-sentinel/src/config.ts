/**
 * The handful of facts about the business that more than one component needs.
 *
 * The WhatsApp number is here because it was previously nowhere: both the
 * primary conversion button on the calculator and the support button in the
 * footer shipped
 *
 *     https://wa.me/numerodetelefono
 *
 * — the literal Spanish words "phone number", left in from a template. The one
 * action the entire page exists to produce went to a WhatsApp error screen,
 * in production, in three languages. It is one constant now, and it is the
 * same number cognitex-landing dials.
 */

/** E.164 without the plus, which is the format wa.me expects. */
export const WHATSAPP_NUMBER = '593996432010';

/** Human-readable form for the one place we print it rather than link it. */
export const WHATSAPP_DISPLAY = '+593 99 643 2010';

export const SUPPORT_EMAIL = 'contact@cognitexindustrial.com';

export const PARENT_SITE = 'https://cognitexindustrial.com';

/** Builds a wa.me link, with the message pre-written when there is one. */
export function whatsappUrl(message?: string): string {
    const base = `https://wa.me/${WHATSAPP_NUMBER}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function mailtoUrl(subject: string): string {
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
