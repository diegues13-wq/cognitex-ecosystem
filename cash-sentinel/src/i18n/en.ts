import type { Dictionary } from './es';
import type { Translated } from './locales';

/** English. Checked key-for-key against the Spanish dictionary at compile time. */
export const en: Translated<Dictionary> = {
    pageTitle: 'Cash Sentinel · USD ⇄ RUB exchange and remittances',
    pageDescription:
        'Work out in seconds what your recipient gets when you send dollars to Russia or roubles to Ecuador. Reference rate, 3% commission, confirmed over WhatsApp.',

    bannerText: 'International transfers with the commission in plain sight.',
    howItWorks: 'How it works',
    support: 'Support',
    languageSwitcherLabel: 'Language',

    sendMoneyTo: 'Send money between',
    russia: 'Russia',
    and: 'and',
    ecuador: 'Ecuador',
    fastAndSecure: 'quickly and clearly.',
    heroSubtitle:
        'Calculate the exchange between dollars and roubles with the commission itemised, then carry on over WhatsApp with a person. No sign-up, no small print.',

    liveUpdate: 'Market rate',
    liveUpdateDesc:
        'We check the rate every minute and tell you whether it came from the market or from us.',
    secure100: 'Figures that add up',
    secure100Desc:
        'You see the amount sent, the commission and the converted net. All three reconcile.',
    lowCommission: '3% commission, shown before you send.',
    whatsappSupport: 'A person on WhatsApp, not a form.',

    calculator: 'Calculator',
    youSend: 'You send',
    amountFieldHint: 'Type the amount. Either a comma or a full stop works as the decimal mark.',
    usdName: 'USD · US dollar',
    rubName: 'RUB · Russian rouble',
    recipientGets: 'Recipient gets',
    swapDirection: 'Swap the direction of the exchange',

    initialAmount: 'Amount sent',
    commission: 'Commission (3%)',
    commissionTooltip: 'Service fee per transaction',
    convertedAmount: 'Amount converted at the rate shown',
    continueTransfer: 'Continue on WhatsApp',
    secureVerified: 'We confirm the final amount with you before anything is sent.',

    rateLiveLabel: 'Market rate',
    rateFallbackLabel: 'Reference rate',
    rateFallbackNote:
        'We could not reach the market, so this is our reference rate. Confirm the live rate over WhatsApp before sending.',
    rateUpdated: 'Updated {time}',
    rateUsdToRub: '1 USD = {rate} RUB',
    rateRubToUsd: '100 RUB = {rate} USD',
    amountCapped: 'This calculator stops at {max}. Message us for larger transfers.',
    quoteDisclaimer:
        'This is an estimate. The final amount is confirmed over WhatsApp before the transfer is made.',

    howItWorksTitle: 'How it works',
    step1Title: 'Calculate',
    step1Desc: 'Type an amount and pick a direction. The commission and net appear as you type.',
    step2Title: 'Message us',
    step2Desc: 'The button opens WhatsApp with your figures already written. We confirm the rate.',
    step3Title: 'Send',
    step3Desc: 'We agree the method, you pay, and we tell you when the recipient has the money.',

    needHelp: 'Need help with a transfer?',
    supportDesc: 'Message us on WhatsApp or by email and we will reply with today’s rate.',
    contactSupport: 'Message on WhatsApp',
    contactByEmail: 'Send an email',

    rightsReserved: 'All rights reserved.',
    poweredBy: 'Built by',

    waMessage:
        'Hello, I would like to start a transfer. I want to send {amount} {from} so the recipient gets {received} {to} (rate {rate}, {rateKind}).',
    waRateKindLive: 'market rate',
    waRateKindFallback: 'reference rate, to be confirmed',
    waSupportMessage: 'Hello, I have a question about a money transfer.',
};
