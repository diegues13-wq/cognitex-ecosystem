import { describe, expect, it } from 'vitest';
import { buildWhatsappMessage, formatBand, moneyFormatter, whatsappUrl } from './calculator-ui';

describe('formatBand', () => {
    const money = moneyFormatter('es');

    it('renders a money range with both ends', () => {
        const out = formatBand({ low: 320, high: 480 }, 'money', money);

        expect(out).toContain('320');
        expect(out).toContain('480');
        expect(out).toContain('–');
    });

    it('collapses to a single figure when both ends round the same', () => {
        const out = formatBand({ low: 400.2, high: 400.4 }, 'money', money);

        expect(out).not.toContain('–');
    });

    it('rounds months to whole numbers', () => {
        expect(formatBand({ low: 6.2, high: 11.8 }, 'months', money)).toBe('6–12');
    });

    it('collapses an equal month range', () => {
        expect(formatBand({ low: 8.1, high: 8.4 }, 'months', money)).toBe('8');
    });
});

describe('buildWhatsappMessage', () => {
    const base = {
        engineLabel: 'energía',
        entries: [
            { label: 'Planilla eléctrica mensual', value: '4000' },
            { label: 'Horas de generador al mes', value: '20' },
        ],
        monthly: '$320 – $480',
        annual: '$3,840 – $5,760',
        locale: 'es',
    };

    it('carries every input the visitor entered', () => {
        const message = buildWhatsappMessage(base);

        expect(message).toContain('Planilla eléctrica mensual: 4000');
        expect(message).toContain('Horas de generador al mes: 20');
    });

    it('carries the resulting figures', () => {
        const message = buildWhatsappMessage(base);

        expect(message).toContain('$320 – $480');
        expect(message).toContain('$3,840 – $5,760');
    });

    it('names the engine so the agent knows which calculator was used', () => {
        expect(buildWhatsappMessage(base)).toContain('energía');
    });

    it('switches language with the locale', () => {
        const en = buildWhatsappMessage({ ...base, locale: 'en', engineLabel: 'energy' });

        expect(en).toContain('Hi Cognitex');
        expect(en).toContain('Estimated monthly saving');
        expect(en).not.toContain('Hola Cognitex');
    });

    it('survives an empty entry list without producing stray bullets', () => {
        const message = buildWhatsappMessage({ ...base, entries: [] });

        expect(message).not.toContain('·');
    });
});

describe('whatsappUrl', () => {
    it('encodes newlines and accents so wa.me receives them intact', () => {
        const url = whatsappUrl('593996432010', 'Hola\nEnergía');

        expect(url).toBe('https://wa.me/593996432010?text=Hola%0AEnerg%C3%ADa');
        expect(url).not.toContain('\n');
    });

    it('encodes the ampersand so it cannot truncate the query string', () => {
        const url = whatsappUrl('593996432010', 'a & b');

        expect(url).toContain('%26');
    });
});
