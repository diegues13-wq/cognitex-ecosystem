import React from 'react';
import { motion } from 'framer-motion';

import TechBackground from './TechBackground';

const Hero = ({ t, setIsContactModalOpen }) => {
    return (
        <section className="relative pt-40 pb-20 px-6 z-10 overflow-hidden">
            <TechBackground />
            <div className="max-w-5xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-xs font-mono font-bold mb-8"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-cyan"></span>
                    </span>
                    {t.status}
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-5xl md:text-7xl font-black mb-6 text-white tracking-tight leading-tight"
                >
                    {t.titleLine1} <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-neon-cyan via-white to-neon-blue text-glow">
                        {t.titleLine2}
                    </span>
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-xl text-neon-cyan font-semibold max-w-2xl mx-auto mb-4 tracking-wide"
                >
                    "{t.slogan}"
                </motion.p>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                    {t.subtitle}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                >
                    <button
                        onClick={() => setIsContactModalOpen(true)}
                        className="px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors shadow-[0_0_25px_rgba(255,255,255,0.3)]"
                    >
                        {t.cta}
                    </button>
                </motion.div>
            </div>

            {/* Glassmorphism Background Accent for Hero */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl h-full max-h-[600px] bg-gradient-to-b from-neon-cyan/5 to-transparent blur-[100px] -z-10 rounded-full pointer-events-none"></div>
        </section>
    );
};

export default Hero;
