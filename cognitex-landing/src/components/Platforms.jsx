import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, ShieldCheck, ArrowRight } from 'lucide-react';
import { APPS } from '../utils/constants';

const Platforms = ({ t }) => {
    const [hoveredApp, setHoveredApp] = useState(null);



    return (
        <section id="platforms" className="py-20 px-6 relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-end justify-between mb-12 border-b border-white/10 pb-6">
                    <div>
                        <h3 className="text-3xl font-black text-white mb-2">{t.title}</h3>
                        <p className="text-gray-400">{t.subtitle}</p>
                    </div>
                    <div className="hidden md:flex gap-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                            <Globe size={14} /> GLOBAL G.3
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                            <ShieldCheck size={14} /> SECURE GATEWAY
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {APPS.map((app, index) => (
                        <motion.div
                            key={app.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            onMouseEnter={() => setHoveredApp(app.id)}
                            onMouseLeave={() => setHoveredApp(null)}
                            className={`relative group p-1 rounded-3xl bg-gradient-to-b from-white/10 to-transparent hover:from-${app.color.split('-')[1]}-500/50 transition-all duration-500`}
                        >
                            <div className="absolute inset-0 bg-industrial-900 rounded-[22px] m-[1px] z-0"></div>
                            <div className={`relative z-10 h-full p-8 rounded-[20px] bg-industrial-950/80 backdrop-blur-xl border border-white/5 overflow-hidden group-hover:bg-industrial-900/50 transition-all duration-500 flex flex-col`}>

                                {/* Hover Glow */}
                                <div className={`absolute -right-20 -top-20 w-64 h-64 ${app.bg} blur-[80px] opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full pointer-events-none`}></div>

                                <div className="flex justify-between items-start mb-8 relative">
                                    <div className={`w-14 h-14 rounded-2xl ${app.bg} ${app.border} border flex items-center justify-center ${app.color} shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-300`}>
                                        <app.icon size={28} />
                                    </div>
                                </div>

                                <h4 className="text-2xl font-bold text-white mb-2 group-hover:text-glow transition-all">{t.items[app.id].title}</h4>
                                <p className={`text-xs font-mono font-bold uppercase tracking-widest mb-4 ${app.color} opacity-80`}>{t.items[app.id].subtitle}</p>
                                <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-1">{t.items[app.id].description}</p>

                                <a
                                    href={`http://localhost:${app.port}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide bg-white/5 border border-white/10 group-hover:bg-white text-white group-hover:text-black transition-all duration-300 flex items-center justify-center gap-2`}
                                >
                                    {t.launch} <ArrowRight size={16} />
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Platforms;
