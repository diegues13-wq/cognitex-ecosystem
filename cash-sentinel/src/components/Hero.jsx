import React from 'react';
import { motion } from 'framer-motion';

const Hero = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
        >
            <div className="inline-flex items-center px-4 py-2 rounded-full glass w-fit border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
                <span className="text-sm font-medium text-emerald-400">Remesas Seguras en Línea</span>
            </div>

            <h2 className="text-5xl lg:text-6xl font-extrabold leading-tight text-white tracking-tight">
                Envía entre <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-amber-500">
                    Ecuador y Rusia
                </span>
            </h2>

            <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
                El sistema más rápido y seguro para convertir USD a RUB y viceversa.
                Calcula tu envío en tiempo real y finaliza el proceso directamente por WhatsApp.
            </p>

            <ul className="flex flex-col gap-3 mt-4">
                <li className="flex items-center text-slate-300">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3 shrink-0">
                        <span className="text-emerald-400 text-xs text-bold">✓</span>
                    </div>
                    Tasa de cambio actualizada al minuto.
                </li>
                <li className="flex items-center text-slate-300">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3 shrink-0">
                        <span className="text-emerald-400 text-xs text-bold">✓</span>
                    </div>
                    Transparencia total, sin costos ocultos.
                </li>
            </ul>
        </motion.div>
    );
};

export default Hero;
