import type { Dictionary } from './es';
import type { Translated } from './locales';

/** Russian. Checked key-for-key against the Spanish dictionary at compile time. */
export const ru: Translated<Dictionary> = {
    pageTitle: 'Cash Sentinel · Обмен USD ⇄ RUB и денежные переводы',
    pageDescription:
        'Посчитайте за секунды, сколько получит адресат при переводе долларов в Россию или рублей в Эквадор. Курс, комиссия 3%, подтверждение в WhatsApp.',

    bannerText: 'Международные переводы: комиссия видна сразу.',
    howItWorks: 'Как это работает',
    support: 'Поддержка',
    languageSwitcherLabel: 'Язык',

    sendMoneyTo: 'Переводите деньги между',
    russia: 'Россией',
    and: 'и',
    ecuador: 'Эквадором',
    fastAndSecure: 'быстро и понятно.',
    heroSubtitle:
        'Рассчитайте обмен долларов и рублей с отдельно показанной комиссией, а затем продолжите в WhatsApp с живым человеком. Без регистрации и без мелкого шрифта.',

    liveUpdate: 'Рыночный курс',
    liveUpdateDesc:
        'Мы запрашиваем курс каждую минуту и честно показываем, рыночный он или наш справочный.',
    secure100: 'Понятный расчёт',
    secure100Desc:
        'Видны сумма перевода, комиссия и конвертированный остаток. Все три величины сходятся.',
    lowCommission: 'Комиссия 3%, показана до отправки.',
    whatsappSupport: 'Живая поддержка в WhatsApp.',

    calculator: 'Калькулятор',
    youSend: 'Вы отправляете',
    amountFieldHint: 'Введите сумму. Разделителем может быть запятая или точка.',
    usdName: 'USD · Доллар США',
    rubName: 'RUB · Российский рубль',
    recipientGets: 'Получатель получит',
    swapDirection: 'Поменять направление обмена',

    initialAmount: 'Сумма перевода',
    commission: 'Комиссия (3%)',
    commissionTooltip: 'Плата за обслуживание одной операции',
    convertedAmount: 'Сумма, конвертированная по показанному курсу',
    continueTransfer: 'Продолжить в WhatsApp',
    secureVerified: 'Итоговую сумму мы подтверждаем с вами до отправки.',

    rateLiveLabel: 'Рыночный курс',
    rateFallbackLabel: 'Справочный курс',
    rateFallbackNote:
        'Не удалось получить рыночный курс, показан наш справочный. Уточните актуальный курс в WhatsApp до отправки.',
    rateUpdated: 'Обновлён в {time}',
    rateUsdToRub: '1 USD = {rate} RUB',
    rateRubToUsd: '100 RUB = {rate} USD',
    amountCapped: 'Максимум для калькулятора: {max}. Для больших сумм напишите нам.',
    quoteDisclaimer:
        'Это предварительный расчёт. Итоговая сумма подтверждается в WhatsApp до совершения перевода.',

    howItWorksTitle: 'Как это работает',
    step1Title: 'Рассчитайте',
    step1Desc: 'Введите сумму и выберите направление. Комиссия и остаток считаются сразу.',
    step2Title: 'Напишите нам',
    step2Desc: 'Кнопка открывает WhatsApp с готовым расчётом. Мы подтверждаем текущий курс.',
    step3Title: 'Отправьте',
    step3Desc: 'Согласуем способ, вы оплачиваете, мы сообщаем, когда получатель получил деньги.',

    needHelp: 'Нужна помощь с переводом?',
    supportDesc: 'Напишите в WhatsApp или на почту — ответим с курсом на сегодня.',
    contactSupport: 'Написать в WhatsApp',
    contactByEmail: 'Написать на почту',

    rightsReserved: 'Все права защищены.',
    poweredBy: 'Разработано',

    waMessage:
        'Здравствуйте, хочу оформить денежный перевод. Отправляю {amount} {from}, чтобы получатель получил {received} {to} (курс {rate}, {rateKind}).',
    waRateKindLive: 'рыночный курс',
    waRateKindFallback: 'справочный курс, требует подтверждения',
    waSupportMessage: 'Здравствуйте, у меня вопрос по денежному переводу.',
};
