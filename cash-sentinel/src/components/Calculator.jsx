import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowDownUp, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const Calculator = ({ t }) => {
    const [rateUsdToRub, setRateUsdToRub] = useState(100);
    const [direction, setDirection] = useState('USD_TO_RUB');
    const [amount, setAmount] = useState(100);
    const [loading, setLoading] = useState(true);

    const COMMISSION_RATE = 0.03;

    useEffect(() => {
        const fetchRate = async () => {
            try {
                const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                const data = await res.json();
                if (data && data.rates && data.rates.RUB) {
                    setRateUsdToRub(data.rates.RUB);
                }
            } catch (error) {
                console.error("Failed to fetch exchange rate:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRate();
        const interval = setInterval(fetchRate, 60000);
        return () => clearInterval(interval);
    }, []);

    const commissionAmount = amount * COMMISSION_RATE;
    const netAmount = amount - commissionAmount;

    let receivedAmount = 0;
    let exchangeRateDisplay = '';

    if (direction === 'USD_TO_RUB') {
        receivedAmount = netAmount * rateUsdToRub;
        exchangeRateDisplay = `1 USD = ${rateUsdToRub.toFixed(2)} RUB`;
    } else {
        const rateRubToUsd = 1 / rateUsdToRub;
        receivedAmount = netAmount * rateRubToUsd;
        exchangeRateDisplay = `100 RUB = ${(rateRubToUsd * 100).toFixed(2)} USD`;
    }

    const toggleDirection = () => {
        setDirection(prev => prev === 'USD_TO_RUB' ? 'RUB_TO_USD' : 'USD_TO_RUB');
        setAmount(receivedAmount > 0 ? Number(receivedAmount.toFixed(2)) : 100);
    };

    const currencySymbolFrom = direction === 'USD_TO_RUB' ? '$' : '₽';
    const currencyNameFrom = direction === 'USD_TO_RUB' ? t('usdName') : t('rubName');

    const currencySymbolTo = direction === 'USD_TO_RUB' ? '₽' : '$';
    const currencyNameTo = direction === 'USD_TO_RUB' ? t('rubName') : t('usdName');

    const handleAmountChange = (e) => {
        const val = parseFloat(e.target.value);
        setAmount(isNaN(val) ? 0 : val);
    };

    const wsParams = {
        amount: amount.toFixed(2),
        from: direction === 'USD_TO_RUB' ? 'USD' : 'RUB',
        received: receivedAmount.toFixed(2),
        to: direction === 'USD_TO_RUB' ? 'RUB' : 'USD'
    };
    const whatsappMessage = encodeURIComponent(t('waMessage', wsParams));
    const whatsappLink = `https://wa.me/numerodetelefono?text=${whatsappMessage}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-md p-6 lg:p-8 rounded-3xl bg-white shadow-2xl shadow-blue-900/10 relative overflow-hidden border border-slate-100"
        >
            <div className="flex justify-between items-center mb-6 lg:mb-8">
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{t('calculator')}</h3>
                <div className="flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                    {loading ? (
                        <RefreshCw className="w-3 h-3 mr-2 animate-spin text-slate-400" />
                    ) : (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                    )}
                    {exchangeRateDisplay}
                </div>
            </div>

            <div className="space-y-6 relative">
                <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100 transition-all shadow-sm">
                    <label className="text-sm text-slate-500 font-extrabold uppercase tracking-widest mb-3 block">{t('youSend')}</label>
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-base font-bold text-slate-800 mb-1">{currencyNameFrom}</span>
                        </div>
                        <div className="flex items-center w-full justify-end">
                            <span className="text-3xl font-bold text-slate-400 mr-2">{currencySymbolFrom}</span>
                            <input
                                type="number"
                                value={amount || ''}
                                onChange={handleAmountChange}
                                className="bg-transparent text-4xl sm:text-5xl font-black text-slate-900 text-right w-full max-w-[180px] focus:outline-none"
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 -mt-2">
                    <button
                        onClick={toggleDirection}
                        className="w-14 h-14 rounded-full bg-blue-700 border-[6px] border-white flex items-center justify-center text-white hover:bg-blue-800 transition-all hover:scale-110 shadow-lg"
                    >
                        <ArrowDownUp className="w-6 h-6" />
                    </button>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border-2 border-blue-100 shadow-inner">
                    <label className="text-sm text-blue-800 font-extrabold uppercase tracking-widest mb-3 block">{t('recipientGets')}</label>
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-base font-bold text-slate-800 mb-1">{currencyNameTo}</span>
                        </div>
                        <div className="flex items-center overflow-hidden w-full justify-end">
                            <span className="text-3xl font-bold text-emerald-600 mr-2 shrink-0">{currencySymbolTo}</span>
                            <span className="text-4xl sm:text-5xl font-black text-emerald-600 tracking-tight truncate">
                                {receivedAmount.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                <div className="flex justify-between text-sm text-slate-600 font-medium">
                    <span>{t('initialAmount')}</span>
                    <span>{currencySymbolFrom}{amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-800 font-bold items-center">
                    <span className="flex items-center gap-1">
                        {t('commission')}
                        <span className="cursor-help text-slate-400" title={t('commissionTooltip')}>
                            <Info className="w-4 h-4" />
                        </span>
                    </span>
                    <span className="text-blue-600">- {currencySymbolFrom}{commissionAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600 font-medium pt-3 mt-1 border-t border-slate-100 border-dashed">
                    <span>{t('convertedAmount')}</span>
                    <span>{currencySymbolFrom}{netAmount.toFixed(2)}</span>
                </div>
            </div>

            <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 w-full flex items-center justify-center py-4 rounded-xl bg-emerald-500 text-white font-bold text-lg hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 active:scale-95"
            >
                {t('continueTransfer')}
            </a>

            <div className="mt-5 flex justify-center items-center text-xs text-slate-500 gap-2 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                {t('secureVerified')}
            </div>
        </motion.div>
    );
};

export default Calculator;
