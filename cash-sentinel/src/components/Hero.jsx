import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Lock } from 'lucide-react';

const Hero = () => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6 text-slate-900"
        >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                Envía dinero a <br />
                <span className="text-slate-900">Rusia</span> <span className="font-light">y</span> <span className="text-slate-900">Ecuador</span> <br />
                <span className="text-slate-700 text-3xl sm:text-4xl">de forma rápida y segura.</span>
            </h2>

            <p className="text-lg text-slate-800 max-w-xl leading-relaxed mt-2 font-medium">
                Conectamos tus finanzas internacionalmente. Usa nuestra plataforma para calcular el cambio de USD a RUB (y viceversa) con total transparencia.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="flex items-start gap-3 bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-yellow-200">
                    <Zap className="w-6 h-6 text-yellow-600 shrink-0" />
                    <div>
                        <h4 className="font-bold text-slate-900">Actualización en Vivo</h4>
                        <p className="text-sm text-slate-600 mt-1">Tasas de cambio sincronizadas al instante con los mercados globales.</p>
                    </div>
                </div>

                <div className="flex items-start gap-3 bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-yellow-200">
                    <Lock className="w-6 h-6 text-yellow-600 shrink-0" />
                    <div>
                        <h4 className="font-bold text-slate-900">100% Seguro</h4>
                        <p className="text-sm text-slate-600 mt-1">Cifrado de extremo a extremo y transacciones verificadas.</p>
                    </div>
                </div>
            </div>

            <ul className="flex flex-col gap-3 mt-4">
                <li className="flex items-center text-slate-800 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 shrink-0" />
                    Baja comisión del 3% transparente.
                </li>
                <li className="flex items-center text-slate-800 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 shrink-0" />
                    Soporte personalizado vía WhatsApp.
                </li>
            </ul>
        </motion.div>
    );
};

export default Hero;
