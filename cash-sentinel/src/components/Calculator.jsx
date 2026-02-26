import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowDownUp, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const Calculator = () => {
    const [rateUsdToRub, setRateUsdToRub] = useState(100); // Default fallback
    const [direction, setDirection] = useState('USD_TO_RUB'); // 'USD_TO_RUB' or 'RUB_TO_USD'
    const [amount, setAmount] = useState(100);
    const [loading, setLoading] = useState(true);

    const COMMISSION_RATE = 0.07; // 7%

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
        const interval = setInterval(fetchRate, 60000); // Update every minute
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
    const currencyNameFrom = direction === 'USD_TO_RUB' ? 'USD - Dólar Estadounidense' : 'RUB - Rublo Ruso';

    const currencySymbolTo = direction === 'USD_TO_RUB' ? '₽' : '$';
    const currencyNameTo = direction === 'USD_TO_RUB' ? 'RUB - Rublo Ruso' : 'USD - Dólar Estadounidense';

    const handleAmountChange = (e) => {
        const val = parseFloat(e.target.value);
        setAmount(isNaN(val) ? 0 : val);
    };

    const whatsappMessage = encodeURIComponent(`Hola, quisiera iniciar una operación de envío de dinero. Deseo enviar ${amount.toFixed(2)} ${direction === 'USD_TO_RUB' ? 'USD' : 'RUB'}, para que el destinatario reciba ${receivedAmount.toFixed(2)} ${direction === 'USD_TO_RUB' ? 'RUB' : 'USD'}.`);
    const whatsappLink = `https://wa.me/numerodetelefono?text=${whatsappMessage}`;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-md p-6 sm:p-8 rounded-3xl glass relative overflow-hidden shadow-2xl shadow-emerald-900/20"
        >
            {/* Glossy highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"></div>

            <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-semibold text-white">Calculadora</h3>
                <div className="flex items-center text-xs text-slate-300 bg-slate-800/50 px-3 py-1.5 rounded-full border border-white/10">
                    {loading ? (
                        <RefreshCw className="w-3 h-3 mr-2 animate-spin text-emerald-400" />
                    ) : (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                    )}
                    {exchangeRateDisplay}
                </div>
            </div>

            <div className="space-y-6 relative">
                {/* From Box */}
                <div className="bg-slate-900/80 rounded-2xl p-4 border border-white/5 transition-colors focus-within:border-emerald-500/50">
                    <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">Tú Envías</label>
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white mb-1">{currencyNameFrom}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-xl text-slate-400 mr-1">{currencySymbolFrom}</span>
                            <input
                                type="number"
                                value={amount || ''}
                                onChange={handleAmountChange}
                                className="bg-transparent text-3xl font-bold text-white text-right w-32 focus:outline-none"
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                {/* Swap Button */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 -mt-2">
                    <button
                        onClick={toggleDirection}
                        className="w-10 h-10 rounded-full bg-slate-900 border-4 border-slate-950 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all hover:scale-110 shadow-lg shadow-black/50"
                    >
                        <ArrowDownUp className="w-4 h-4" />
                    </button>
                </div>

                {/* To Box */}
                <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900/60 rounded-2xl p-4 border border-emerald-500/20">
                    <label className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-2 block">Destinatario Recibe</label>
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white mb-1">{currencyNameTo}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-xl text-emerald-500 mr-1">{currencySymbolTo}</span>
                            <span className="text-3xl font-bold text-white tracking-tight">
                                {receivedAmount.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                <div className="flex justify-between text-sm text-slate-400">
                    <span>Monto inicial</span>
                    <span>{currencySymbolFrom}{amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-amber-400/90 font-medium">
                    <span className="flex items-center gap-1">
                        Comisión (7%)
                        <span className="cursor-help" title="Tarifa de servicio por transacción segura">
                            <Info className="w-3 h-3" />
                        </span>
                    </span>
                    <span>- {currencySymbolFrom}{commissionAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-300">
                    <span>Monto convertido a la tasa actual</span>
                    <span>{currencySymbolFrom}{netAmount.toFixed(2)}</span>
                </div>
            </div>

            <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 w-full block text-center py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg hover:from-emerald-400 hover:to-green-500 transition-all shadow-lg shadow-emerald-500/25 filter brightness-110"
            >
                Continuar Envío por WhatsApp
            </a>

            <div className="mt-4 flex justify-center items-center text-xs text-slate-500 gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500/50"></span>
                Transacción 100% Segura y Verificada
            </div>
        </motion.div>
    );
};

export default Calculator;
