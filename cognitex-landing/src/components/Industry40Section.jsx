import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, Bot, Box, Network, Wifi, ShieldCheck, Cloud, Printer, Glasses,
    ArrowRight, Zap, RefreshCw, Layers
} from 'lucide-react';

const Industry40Section = ({ translations }) => {
    const [activeNode, setActiveNode] = useState(null);

    const icons = {
        bigdata: Database,
        robots: Bot,
        sim: Box,
        integration: Network,
        iiot: Wifi,
        cyber: ShieldCheck,
        cloud: Cloud,
        additive: Printer,
        ar: Glasses
    };

    return (
        <section className="py-24 px-6 bg-industrial-950 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-industrial-900 via-industrial-950 to-black opacity-80 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent"></div>

            <div className="max-w-7xl mx-auto relative z-10">

                {/* HEADER */}
                <div className="text-center mb-20">
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-neon-cyan font-mono text-sm tracking-[0.2em] mb-4 uppercase"
                    >
                        {translations.subtitle}
                    </motion.h3>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black text-white mb-6"
                    >
                        {translations.title}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed"
                    >
                        {translations.description}
                    </motion.p>
                </div>

                {/* WORKFLOW VISUALIZATION */}
                <div className="mb-24">
                    <h4 className="text-center text-white font-bold mb-12 flex items-center justify-center gap-2">
                        <RefreshCw className="text-neon-green" /> {translations.workflowTitle}
                    </h4>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                        {translations.workflow.map((step, index) => (
                            <React.Fragment key={index}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.2 }}
                                    className="bg-white/5 border border-white/10 px-6 py-3 rounded-lg text-sm text-gray-300 font-mono"
                                >
                                    {step}
                                </motion.div>
                                {index < translations.workflow.length - 1 && (
                                    <motion.div
                                        initial={{ opacity: 0, width: 0 }}
                                        whileInView={{ opacity: 1, width: 'auto' }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.2 + 0.1 }}
                                    >
                                        <ArrowRight className="text-gray-600 rotate-90 md:rotate-0" />
                                    </motion.div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* HEXAGONAL GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
                    {translations.nodes.map((node, index) => {
                        const Icon = icons[node.id];
                        const isActive = activeNode === node.id;

                        return (
                            <motion.div
                                key={node.id}
                                layout
                                onMouseEnter={() => setActiveNode(node.id)}
                                onMouseLeave={() => setActiveNode(null)}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                className={`relative group bg-industrial-900/50 backdrop-blur-sm border ${isActive ? 'border-neon-cyan/50 bg-industrial-800' : 'border-white/5'} p-6 rounded-2xl transition-colors duration-300 cursor-default hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg ${isActive ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-white/5 text-gray-400'} transition-colors duration-300`}>
                                        <Icon size={24} />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold mb-2 ${isActive ? 'text-white' : 'text-gray-300'} transition-colors`}>{node.title}</h4>
                                        <p className="text-sm text-gray-500 leading-relaxed group-hover:text-gray-300 transition-colors">
                                            {node.desc}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* BENEFITS SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/5 pt-12">
                    <div className="md:col-span-3 text-center mb-4">
                        <h4 className="text-xl font-bold text-white mb-2">{translations.benefitsTitle}</h4>
                    </div>
                    {translations.benefits.map((benefit, idx) => (
                        <div key={idx} className="text-center">
                            <div className="w-12 h-12 mx-auto bg-neon-cyan/10 rounded-full flex items-center justify-center mb-4 text-neon-cyan">
                                {idx === 0 ? <Zap size={20} /> : idx === 1 ? <RefreshCw size={20} /> : <Layers size={20} />}
                            </div>
                            <h5 className="text-white font-bold mb-2">{benefit.title}</h5>
                            <p className="text-gray-500 text-sm">{benefit.desc}</p>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
};

export default Industry40Section;
