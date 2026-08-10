import { useId, useState } from 'react';
import { ArrowDownUp, Info, MessageCircle } from 'lucide-react';
import { StatusDot } from '@cognitex/ui';

import { whatsappUrl } from '../config';
import type { RateResult } from '../data/rates';
import {
    CURRENCY_SYMBOL,
    MAX_MAJOR_AMOUNT,
    flipDirection,
    formatAmount,
    formatPlain,
    parseAmountInput,
    quote,
    type Direction,
} from '../domain/exchange';
import { LOCALE_META, type Locale, type Translate } from '../i18n';

export interface CalculatorProps {
    t: Translate;
    locale: Locale;
    rate: RateResult;
}

/**
 * The calculator.
 *
 * It holds three pieces of state — the raw text in the field, the direction,
 * and nothing else. Every figure on screen is derived from `quote()` on each
 * render, so there is no way for the commission line and the received line to
 * disagree about which amount they describe.
 *
 * The amount is kept as the string the user typed rather than as a number.
 * Storing a number means an empty field has to be represented as 0, which is
 * why the old version rendered `value={amount || ''}` — an expression that
 * also blanks the field the moment someone legitimately types 0.
 */
export function Calculator({ t, locale, rate }: CalculatorProps) {
    const [direction, setDirection] = useState<Direction>('USD_TO_RUB');
    const [amountText, setAmountText] = useState('100');

    const amountId = useId();
    const hintId = useId();
    const noticeId = useId();

    const numberLocale = LOCALE_META[locale].numberLocale;
    const result = quote({
        amount: parseAmountInput(amountText),
        direction,
        rateUsdToRub: rate.rate,
    });

    const live = rate.source === 'live';
    const fromSymbol = CURRENCY_SYMBOL[result.from];
    const toSymbol = CURRENCY_SYMBOL[result.to];
    const fromName = result.from === 'USD' ? t('usdName') : t('rubName');
    const toName = result.to === 'USD' ? t('usdName') : t('rubName');

    const rateText =
        direction === 'USD_TO_RUB'
            ? t('rateUsdToRub', { rate: formatAmount(result.rateUsdToRub, numberLocale) })
            : t('rateRubToUsd', {
                  rate: formatAmount(result.appliedRate * 100, numberLocale),
              });

    const whatsappMessage = t('waMessage', {
        amount: formatPlain(result.gross),
        from: result.from,
        received: formatPlain(result.received),
        to: result.to,
        rate: formatPlain(result.rateUsdToRub),
        rateKind: live ? t('waRateKindLive') : t('waRateKindFallback'),
    });

    /**
     * Swapping carries the figure across, so "what would it cost to send the
     * other way?" is one tap. It uses the machine-readable form: writing a
     * grouped, localised string back into the field would then have to be
     * re-parsed, and a round trip through two conventions is where digits go
     * missing.
     */
    const swap = () => {
        setDirection(flipDirection(direction));
        if (result.received > 0) setAmountText(formatPlain(result.received));
    };

    return (
        <section
            aria-labelledby={`${amountId}-title`}
            className="panel-raised animate-rise w-full max-w-md p-6 lg:p-7"
            id="calculadora"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id={`${amountId}-title`} className="text-lg font-semibold">
                    {t('calculator')}
                </h2>

                <p
                    className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs tabular"
                    style={{
                        borderColor: live
                            ? 'color-mix(in srgb, var(--color-ok) 35%, transparent)'
                            : 'color-mix(in srgb, var(--color-warn) 35%, transparent)',
                        color: live ? 'var(--color-ok)' : 'var(--color-warn)',
                    }}
                >
                    <StatusDot
                        status={live ? 'ok' : 'warning'}
                        label={live ? t('rateLiveLabel') : t('rateFallbackLabel')}
                    />
                    <span>{rateText}</span>
                </p>
            </div>

            {/* The rate's provenance, in words, where it cannot be missed. */}
            <p className="mt-3 text-xs leading-relaxed text-steel">
                {live && rate.fetchedAt !== null
                    ? `${t('rateLiveLabel')} · ${t('rateUpdated', {
                          time: new Date(rate.fetchedAt).toLocaleTimeString(numberLocale, {
                              hour: '2-digit',
                              minute: '2-digit',
                          }),
                      })}`
                    : null}
                {!live ? (
                    <span style={{ color: 'var(--color-warn)' }}>{t('rateFallbackNote')}</span>
                ) : null}
            </p>

            <div className="relative mt-5 space-y-3">
                <div className="panel p-5 transition-colors duration-150 focus-within:border-brand">
                    <label htmlFor={amountId} className="label-mono block">
                        {t('youSend')}
                    </label>

                    <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-ice/80">{fromName}</span>

                        <div className="flex min-w-0 items-center gap-1">
                            <span aria-hidden="true" className="text-2xl text-steel">
                                {fromSymbol}
                            </span>
                            <input
                                id={amountId}
                                aria-describedby={`${hintId} ${noticeId}`}
                                className="min-h-11 w-full max-w-44 bg-transparent text-right text-3xl font-semibold tabular outline-none sm:text-4xl"
                                inputMode="decimal"
                                autoComplete="off"
                                spellCheck={false}
                                type="text"
                                value={amountText}
                                onChange={(event) => setAmountText(event.target.value)}
                            />
                        </div>
                    </div>

                    <p id={hintId} className="mt-2 text-xs text-steel">
                        {t('amountFieldHint')}
                    </p>
                </div>

                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={swap}
                        aria-label={t('swapDirection')}
                        className="-my-1 flex size-11 min-h-11 items-center justify-center rounded-full bg-brand text-navy-900 transition-transform duration-150 ease-out-expo hover:scale-105"
                    >
                        <ArrowDownUp aria-hidden="true" className="size-5" />
                    </button>
                </div>

                <div className="panel p-5">
                    <p className="label-mono">{t('recipientGets')}</p>

                    <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-ice/80">{toName}</span>

                        <output
                            htmlFor={amountId}
                            aria-live="polite"
                            className="flex min-w-0 items-baseline gap-1 text-right"
                            style={{ color: 'var(--color-ok)' }}
                        >
                            <span aria-hidden="true" className="text-2xl">
                                {toSymbol}
                            </span>
                            <span className="truncate text-3xl font-semibold tabular sm:text-4xl">
                                {formatAmount(result.received, numberLocale)}
                            </span>
                        </output>
                    </div>
                </div>
            </div>

            <p id={noticeId} className="mt-3 min-h-4 text-xs" style={{ color: 'var(--color-warn)' }}>
                {result.adjustment === 'capped'
                    ? t('amountCapped', {
                          max: `${fromSymbol}${formatAmount(MAX_MAJOR_AMOUNT, numberLocale)}`,
                      })
                    : ''}
            </p>

            <dl className="mt-5 space-y-2.5 border-t border-navy-700 pt-5 text-sm">
                <div className="flex justify-between gap-4">
                    <dt className="text-steel">{t('initialAmount')}</dt>
                    <dd className="tabular">
                        {fromSymbol}
                        {formatAmount(result.gross, numberLocale)}
                    </dd>
                </div>

                <div className="flex justify-between gap-4">
                    <dt className="flex items-center gap-1.5 text-steel">
                        {t('commission')}
                        {/* The explanation is in the accessibility tree rather
                            than in a hover tooltip, which is unreachable by
                            keyboard and by touch — as the old title= was. */}
                        <Info aria-hidden="true" className="size-4 shrink-0" />
                        <span className="sr-only">{t('commissionTooltip')}</span>
                    </dt>
                    <dd className="tabular" style={{ color: 'var(--color-brand)' }}>
                        −{fromSymbol}
                        {formatAmount(result.commission, numberLocale)}
                    </dd>
                </div>

                <div className="flex justify-between gap-4 border-t border-dashed border-navy-700 pt-2.5">
                    <dt className="text-steel">{t('convertedAmount')}</dt>
                    <dd className="tabular">
                        {fromSymbol}
                        {formatAmount(result.net, numberLocale)}
                    </dd>
                </div>
            </dl>

            <a
                href={whatsappUrl(whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-navy-900 transition-transform duration-150 ease-out-expo hover:scale-[1.01]"
                style={{ backgroundColor: 'var(--color-ok)' }}
            >
                <MessageCircle aria-hidden="true" className="size-5" />
                {t('continueTransfer')}
            </a>

            <p className="mt-4 text-center text-xs leading-relaxed text-steel">
                {t('secureVerified')}
            </p>
        </section>
    );
}
