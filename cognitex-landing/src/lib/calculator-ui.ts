/**
 * Presentation logic for the ROI calculators.
 *
 * Kept out of the .astro <script> so it can be unit-tested: the WhatsApp
 * message built here is what a prospect actually receives, and the sales
 * agent quotes it back. A formatting bug here is a commercial bug.
 */
import type { Band } from './roi';

export type BandKind = 'money' | 'months';

export function moneyFormatter(locale: string): Intl.NumberFormat {
    return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-EC', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    });
}

/** Renders a band as a range. Months are whole numbers; money is currency. */
export function formatBand(b: Band, kind: BandKind, money: Intl.NumberFormat): string {
    if (kind === 'months') {
        const low = Math.round(b.low);
        const high = Math.round(b.high);
        return low === high ? `${low}` : `${low}–${high}`;
    }
    const low = money.format(b.low);
    const high = money.format(b.high);
    return low === high ? low : `${low} – ${high}`;
}

export interface MessageInput {
    engineLabel: string;
    /** Visitor-entered values, already labelled and filtered. */
    entries: { label: string; value: string }[];
    monthly: string;
    annual: string;
    locale: string;
}

/**
 * Composes the WhatsApp hand-off (spec §4.4): the agent opens the chat already
 * holding the visitor's inputs and the resulting figure.
 */
export function buildWhatsappMessage(input: MessageInput): string {
    const isEs = input.locale !== 'en';

    const lines = input.entries.map((entry) => `· ${entry.label}: ${entry.value}`).join('\n');

    return isEs
        ? [
              `Hola Cognitex. Usé la calculadora de ${input.engineLabel} y me salió esto:`,
              '',
              lines,
              '',
              `Ahorro mensual estimado: ${input.monthly}`,
              `Anual: ${input.annual}`,
              '',
              'Quiero que lo revisemos.',
          ].join('\n')
        : [
              `Hi Cognitex. I used the ${input.engineLabel} calculator and got this:`,
              '',
              lines,
              '',
              `Estimated monthly saving: ${input.monthly}`,
              `Annual: ${input.annual}`,
              '',
              "I'd like to go over it.",
          ].join('\n');
}

/** Full wa.me URL with the message encoded. */
export function whatsappUrl(number: string, message: string): string {
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
