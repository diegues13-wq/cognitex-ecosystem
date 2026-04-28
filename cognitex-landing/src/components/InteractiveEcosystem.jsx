import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionHeader from './common/SectionHeader';
import { Factory, CloudLightning, LayoutDashboard, BrainCircuit, CheckCircle2, Zap, Briefcase } from 'lucide-react';

const iconMap = {
    Factory, CloudLightning, LayoutDashboard, BrainCircuit, Briefcase
};

const InteractiveEcosystem = ({ translations }) => {
    const [activePhase, setActivePhase] = useState(translations.phases[0]);

    return (
        <section id="ecosystem" className="py-24 px-6 relative z-10 bg-black border-y border-white/5 overflow-hidden">
            {/* Ambient Background matching the active phase */}
            <AnimatePresence>
                <motion.div
                    key={activePhase.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.12 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className={`absolute inset-0 ${activePhase.bg} blur-[150px] pointer-events-none`}
                />
            </AnimatePresence>
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <SectionHeader
                    kicker={translations.subtitle}
                    title={translations.title}
                    description={translations.description}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">

                    {/* LEFT PANEL: Pipeline/Timeline */}
                    <div className="lg:col-span-4 flex flex-col gap-3 relative">
                        <div className="absolute left-[31px] top-8 bottom-8 w-px bg-white/10 hidden lg:block z-0"></div>

                        {translations.phases.map((phase) => {
                            const isActive = activePhase.id === phase.id;
                            const IconCmp = iconMap[phase.icon] || Factory;
                            return (
                                <button
                                    key={phase.id}
                                    onClick={() => setActivePhase(phase)}
                                    className={`relative z-10 flex items-center p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                                        isActive
                                        ? `${phase.bg.replace('/20','/10')} ${phase.border} shadow-[0_0_20px_rgba(255,255,255,0.03)] scale-[1.02]`
                                        : 'bg-industrial-900/50 border-white/5 hover:border-white/20 hover:bg-industrial-800'
                                    }`}
                                >
                                    <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center border transition-colors ${
                                        isActive ? `${phase.border} ${phase.color} bg-black/50` : 'border-white/10 text-gray-500 bg-industrial-950/80'
                                    }`}>
                                        <IconCmp size={20} />
                                    </div>
                                    <div className="flex-1 ml-4">
                                        <p className={`font-mono text-[10px] tracking-widest mb-1 ${isActive ? phase.color : 'text-gray-500'}`}>
                                            {phase.tab}
                                        </p>
                                        <h4 className={`font-bold text-sm md:text-base transition-colors ${isActive ? 'text-white' : 'text-gray-400'}`}>
                                            {phase.name}
                                        </h4>
                                    </div>
                                    {isActive && (
                                        <motion.div layoutId="activeIndicator" className={`absolute -right-2 w-4 h-4 rounded-full ${phase.bg.replace('/20','')} shadow-[0_0_10px_currentColor] border-2 border-black ${phase.color} hidden lg:block`} />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* RIGHT PANEL: Dynamic Content */}
                    <div className="lg:col-span-8 relative min-h-[420px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activePhase.id}
                                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className={`w-full h-full bg-industrial-950/80 backdrop-blur-xl border ${activePhase.border} rounded-3xl p-6 md:p-12 flex flex-col justify-center relative shadow-2xl overflow-hidden`}
                            >
                                <div className={`absolute -right-24 -top-24 w-72 h-72 rounded-full ${activePhase.bg} blur-[80px] opacity-60 pointer-events-none`}></div>

                                <div className="relative z-10">
                                    <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
                                        <div className={`p-4 rounded-2xl border ${activePhase.border} ${activePhase.bg} ${activePhase.color} self-start`}>
                                            {React.createElement(iconMap[activePhase.icon] || Factory, { size: 48, strokeWidth: 1.5 })}
                                        </div>
                                        <div>
                                            <h3 className={`font-mono text-sm tracking-widest mb-2 ${activePhase.color}`}>
                                                {activePhase.tab}
                                            </h3>
                                            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
                                                {activePhase.name}
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                        {/* Technologies */}
                                        <div className="bg-black/50 border border-white/5 p-6 rounded-2xl">
                                            <h4 className={`font-bold mb-4 flex items-center gap-2 ${activePhase.color}`}>
                                                <Zap size={18} />
                                                {translations.technologies_label}
                                            </h4>
                                            <ul className="space-y-4">
                                                {activePhase.technologies.map((tech, i) => (
                                                    <motion.li
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.1 + (i * 0.1) }}
                                                        key={i}
                                                        className="flex items-start gap-3 text-sm text-gray-300"
                                                    >
                                                        <CheckCircle2 size={18} className={`shrink-0 mt-0.5 ${activePhase.color}`} />
                                                        <span className="leading-snug">{tech}</span>
                                                    </motion.li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Operational Impact */}
                                        <div className={`bg-gradient-to-br from-black/80 to-industrial-950 border border-white/10 p-6 rounded-2xl relative overflow-hidden group flex flex-col justify-center`}>
                                            <div className={`absolute inset-0 ${activePhase.bg} opacity-5 group-hover:opacity-15 transition-opacity duration-500`}></div>
                                            <h4 className="font-mono text-white/40 mb-3 text-[10px] tracking-[0.2em] font-bold uppercase">
                                                {translations.impact_label}
                                            </h4>
                                            <p className="text-white text-lg md:text-xl leading-relaxed font-medium relative z-10 italic">
                                                "{activePhase.benefit}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default InteractiveEcosystem;
