/**
 * Spanish — the source of truth for the key set.
 *
 * `Dictionary` is derived from this object, so every other language is checked
 * against it at compile time. Add a key here and the build fails until English
 * and Russian have it too.
 *
 * Values in braces are filled by `interpolate`; the placeholder names have to
 * match across languages because the call site passes one set of parameters.
 */
export const es = {
    pageTitle: 'Cash Sentinel · Cambio USD ⇄ RUB y remesas',
    pageDescription:
        'Calcula en segundos cuánto recibe tu destinatario al enviar dólares a Rusia o rublos a Ecuador. Tasa de referencia, comisión del 3% y confirmación por WhatsApp.',

    bannerText: 'Tus transferencias internacionales, con la comisión a la vista.',
    howItWorks: '¿Cómo funciona?',
    support: 'Soporte',
    languageSwitcherLabel: 'Idioma',

    sendMoneyTo: 'Envía dinero entre',
    russia: 'Rusia',
    and: 'y',
    ecuador: 'Ecuador',
    fastAndSecure: 'de forma rápida y clara.',
    heroSubtitle:
        'Calcula el cambio entre dólares y rublos con la comisión desglosada, y continúa por WhatsApp con una persona. Sin registro y sin letra pequeña.',

    liveUpdate: 'Tasa del mercado',
    liveUpdateDesc:
        'Consultamos la tasa cada minuto y te decimos si es del mercado o una referencia nuestra.',
    secure100: 'Cuentas claras',
    secure100Desc:
        'Ves el monto inicial, la comisión y el neto convertido. Las tres cifras suman.',
    lowCommission: 'Comisión del 3%, mostrada antes de enviar.',
    whatsappSupport: 'Atención personal por WhatsApp.',

    calculator: 'Calculadora',
    youSend: 'Tú envías',
    amountFieldHint: 'Escribe el monto. Puedes usar coma o punto decimal.',
    usdName: 'USD · Dólar estadounidense',
    rubName: 'RUB · Rublo ruso',
    recipientGets: 'El destinatario recibe',
    swapDirection: 'Invertir la dirección del cambio',

    initialAmount: 'Monto inicial',
    commission: 'Comisión (3%)',
    commissionTooltip: 'Tarifa de servicio por transacción',
    convertedAmount: 'Monto convertido a la tasa mostrada',
    continueTransfer: 'Continuar por WhatsApp',
    secureVerified: 'Confirmamos el monto final contigo antes de enviar.',

    rateLiveLabel: 'Tasa del mercado',
    rateFallbackLabel: 'Tasa de referencia',
    rateFallbackNote:
        'No pudimos consultar el mercado, así que mostramos una tasa de referencia. Confirma la tasa real por WhatsApp antes de enviar.',
    rateUpdated: 'Actualizada {time}',
    rateUsdToRub: '1 USD = {rate} RUB',
    rateRubToUsd: '100 RUB = {rate} USD',
    amountCapped: 'Monto máximo de esta calculadora: {max}. Escríbenos para operaciones mayores.',
    quoteDisclaimer:
        'Este cálculo es una estimación. El monto final se confirma por WhatsApp antes de realizar el envío.',

    howItWorksTitle: 'Cómo funciona',
    step1Title: 'Calcula',
    step1Desc: 'Escribe el monto y elige la dirección. Ves la comisión y el neto al instante.',
    step2Title: 'Escríbenos',
    step2Desc: 'El botón abre WhatsApp con tu cálculo ya escrito. Confirmamos la tasa vigente.',
    step3Title: 'Envía',
    step3Desc: 'Acordamos el método, realizas el pago y te avisamos cuando el destinatario recibe.',

    needHelp: '¿Necesitas ayuda con tu envío?',
    supportDesc: 'Escríbenos por WhatsApp o por correo y te respondemos con la tasa del día.',
    contactSupport: 'Escribir por WhatsApp',
    contactByEmail: 'Escribir por correo',

    rightsReserved: 'Todos los derechos reservados.',
    poweredBy: 'Desarrollado por',

    waMessage:
        'Hola, quisiera iniciar un envío de dinero. Deseo enviar {amount} {from} para que el destinatario reciba {received} {to} (tasa {rate}, {rateKind}).',
    waRateKindLive: 'tasa del mercado',
    waRateKindFallback: 'tasa de referencia, pendiente de confirmar',
    waSupportMessage: 'Hola, tengo una consulta sobre un envío de dinero.',
} as const;

/** The key set every language has to satisfy. */
export type Dictionary = typeof es;
