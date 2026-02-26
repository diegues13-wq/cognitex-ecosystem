import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowDownUp, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const Calculator = () => {
    const [rateUsdToRub, setRateUsdToRub] = useState(100); // Default fallback
    const [direction, setDirection] = useState('USD_TO_RUB'); // 'USD_TO_RUB' or 'RUB_TO_USD'
    const [amount, setAmount] = useState(100);
    const [loading, setLoading] = useState(true);

    const COMMISSION_RATE = 0.03; // 3%

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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-white shadow-2xl relative overflow-hidden"
        >

            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Calculadora</h3>
                <div className="flex items-center text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                    {loading ? (
                        <RefreshCw className="w-3 h-3 mr-2 animate-spin text-slate-500" />
                    ) : (
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                    )}
                    {exchangeRateDisplay}
                </div>
            </div>

            <div className="space-y-6 relative">
                {/* From Box */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-inner group focus-within:border-yellow-400 focus-within:ring-1 focus-within:ring-yellow-400 transition-all">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 block">Tú Envías</label>
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 mb-1">{currencyNameFrom}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-xl font-bold text-slate-400 mr-1">{currencySymbolFrom}</span>
                            <input
                                type="number"
                                value={amount || ''}
                                onChange={handleAmountChange}
                                className="bg-transparent text-3xl font-black text-slate-900 text-right w-32 focus:outline-none"
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                {/* Swap Button */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 -mt-2">
                    <button
                        onClick={toggleDirection}
                        className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all hover:scale-105 shadow-md"
                    >
                        <ArrowDownUp className="w-5 h-5" />
                    </button>
                </div>

                {/* To Box */}
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 shadow-sm">
                    <label className="text-xs text-yellow-800 font-bold uppercase tracking-wider mb-2 block">Destinatario Recibe</label>
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 mb-1">{currencyNameTo}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-xl font-bold text-yellow-600 mr-1">{currencySymbolTo}</span>
                            <span className="text-3xl font-black text-slate-900 tracking-tight">
                                {receivedAmount.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                <div className="flex justify-between text-sm text-slate-600 font-medium">
                    <span>Monto inicial</span>
                    <span>{currencySymbolFrom}{amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-800 font-bold items-center">
                    <span className="flex items-center gap-1">
                        Comisión (3%)
                        <span className="cursor-help text-slate-400" title="Tarifa de servicio reducida por transacción">
                            <Info className="w-3 h-3" />
                        </span>
                    </span>
                    <span className="text-red-600">- {currencySymbolFrom}{commissionAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600 font-medium pt-2 border-t border-slate-50 border-dashed">
                    <span>Monto convertido a tasa actual</span>
                    <span>{currencySymbolFrom}{netAmount.toFixed(2)}</span>
                </div>
            </div>

            <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 w-full block text-center py-4 rounded-xl bg-yellow-400 text-slate-900 font-black text-lg hover:bg-yellow-500 transition-all shadow-md active:scale-95"
            >
                Continuar Envío
            </a>

            <div className="mt-4 flex justify-center items-center text-xs text-slate-500 gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Transacción 100% Segura y Verificada
            </div>
        </motion.div>
    );
};

export default Calculator;
