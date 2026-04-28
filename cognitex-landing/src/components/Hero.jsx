import React from 'react';
import { motion } from 'framer-motion';
import TechBackground from './TechBackground';

const STATS = ['stat1', 'stat2', 'stat3', 'stat4'];

const Hero = ({ t, setIsContactModalOpen }) => {
    return (
        <section className="relative pt-40 pb-16 px-6 z-10 overflow-hidden">
            <TechBackground />

            <div className="max-w-5xl mx-auto text-center">
                {/* Status badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-xs font-mono font-bold mb-8"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-cyan"></span>
                    </span>
                    {t.status}
                </motion.div>

                {/* Main heading */}
                <motion.h1
                    initial={{ opacity: 0, y: 30, filter: 'blur(15px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="flex flex-col items-center mb-6"
                >
                    <span className="text-4xl md:text-5xl lg:text-6xl font-black mb-2 text-white tracking-tight leading-tight block">
                        {t.titleLine1}
                    </span>
                    <motion.span
                        initial={{ opacity: 0, scale: 0.9, filter: 'blur(15px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                        className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter leading-tight block"
                    >
                        <motion.span
                            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                            transition={{ duration: 6, ease: "linear", repeat: Infinity }}
                            className="inline-block bg-clip-text text-transparent bg-[linear-gradient(to_right,#06b6d4,#ffffff,#3b82f6,#a855f7,#06b6d4)] bg-[length:250%_auto] drop-shadow-[0_0_30px_rgba(6,182,212,0.5)] pb-2"
                        >
                            {t.titleLine2}
                        </motion.span>
                    </motion.span>
                </motion.h1>

                {/* Slogan */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.35 }}
                    className="text-lg md:text-xl text-neon-cyan font-semibold max-w-2xl mx-auto mb-3 tracking-wide italic"
                >
                    "{t.slogan}"
                </motion.p>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.45 }}
                    className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                    {t.description}
                </motion.p>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
                >
                    <button
                        onClick={() => setIsContactModalOpen(true)}
                        className="relative px-8 py-4 bg-neon-cyan text-black font-black rounded-xl tracking-wider uppercase text-sm hover:bg-white transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.35)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] group overflow-hidden"
                    >
                        <span className="relative z-10">{t.cta}</span>
                        <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                    <a
                        href="#about"
                        className="flex items-center gap-2 text-sm font-mono text-gray-400 hover:text-white transition-colors group"
                    >
                        <span>{t.stat4_val} {t.stat4_label}</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                </motion.div>

                {/* Stats row */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.75 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/10"
                >
                    {STATS.map((key, i) => (
                        <div key={key} className="bg-industrial-950/90 px-6 py-5 flex flex-col items-center gap-1 hover:bg-industrial-900/80 transition-colors">
                            <span className="text-2xl md:text-3xl font-black text-white tabular-nums">
                                {t[`${key}_val`]}
                            </span>
                            <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase text-center leading-tight">
                                {t[`${key}_label`]}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl h-full max-h-[600px] bg-gradient-to-b from-neon-cyan/5 to-transparent blur-[100px] -z-10 rounded-full pointer-events-none"></div>
        </section>
    );
};

export default Hero;
