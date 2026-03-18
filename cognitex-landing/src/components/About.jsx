import React from 'react';
import { motion } from 'framer-motion';
import { Search, Cog, Combine, CloudLightning, LayoutDashboard, LineChart, BrainCircuit, Factory } from 'lucide-react';
import SectionHeader from './common/SectionHeader';

const About = ({ t }) => {
    return (
        <section id="about" className="py-24 px-6 relative z-10 bg-industrial-950/80 border-y border-white/5 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neon-cyan/5 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-neon-green/5 blur-[120px] rounded-full pointer-events-none"></div>
            
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20 lg:mb-32">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <SectionHeader 
                            alignment="left"
                            kicker={t.title}
                            title={t.subtitle}
                            className="!mb-8 md:!mb-10"
                        />
                        <p className="text-xl font-medium text-neon-cyan/70 mb-6 border-l-2 border-neon-cyan pl-4">
                            {t.slogan}
                        </p>
                        <p className="text-gray-400 leading-relaxed text-lg">
                            {t.description}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        {/* OUT OF THE BOX: 3D Isometric Tech Stack Graphic */}
                        <div 
                            className="aspect-square md:aspect-video lg:aspect-square bg-gradient-to-br from-industrial-900 via-industrial-950 to-black rounded-3xl border border-white/10 p-0 relative overflow-hidden shadow-2xl flex items-center justify-center"
                            style={{ perspective: '1200px' }}
                        >
                            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                            
                            {/* Central Data Beam / Laser */}
                            <motion.div 
                                initial={{ height: 0 }}
                                whileInView={{ height: '75%' }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                className="absolute w-2 bg-gradient-to-t from-gray-600 via-neon-cyan to-neon-purple blur-[6px] z-0 opacity-70"
                            />
                            <motion.div 
                                initial={{ height: 0 }}
                                whileInView={{ height: '75%' }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                className="absolute w-px bg-white/60 z-0"
                            />

                            <h5 className="absolute top-8 left-1/2 -translate-x-1/2 z-10 text-center font-mono text-white/30 tracking-[0.4em] text-[10px] md:text-xs font-bold uppercase backdrop-blur-sm px-4 py-1 rounded-full border border-white/5">
                                Arquitectura Cognitex
                            </h5>

                            {/* Isometric Layers Container */}
                            <div className="relative w-full h-full max-h-[500px] flex items-center justify-center mt-8">
                                
                                {/* Layer 1: Edge (Bottom) */}
                                <div className="absolute top-[65%] w-full flex justify-center items-center z-10">
                                    <motion.div
                                        animate={{ y: [0, -5, 0] }}
                                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                                        style={{ rotateX: 65, rotateZ: 45 }}
                                        className="w-32 h-32 md:w-48 md:h-48 border border-gray-500 bg-gray-500/10 backdrop-blur-md shadow-[0_0_30px_rgba(156,163,175,0.15)] flex items-center justify-center absolute hover:bg-gray-500/20 transition-colors cursor-pointer"
                                    >
                                        <div className="w-[80%] h-[80%] border border-gray-500/40 border-dashed rounded-full flex items-center justify-center bg-black/20">
                                            <Factory size={28} className="text-gray-400" />
                                        </div>
                                    </motion.div>
                                    
                                    {/* Label Left */}
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="absolute right-[55%] md:right-[60%] mr-6 md:mr-10 text-right bg-industrial-950/80 border border-white/5 py-2 px-3 md:px-4 rounded-xl backdrop-blur-xl shadow-lg"
                                    >
                                        <div className="text-gray-400 font-mono text-[8px] md:text-[9px] tracking-widest mb-1">CAPA 01</div>
                                        <div className="text-white font-bold text-xs md:text-sm">Hardware Edge</div>
                                    </motion.div>
                                    {/* Connection Line */}
                                    <div className="absolute right-[50%] mr-2 md:mr-4 w-8 md:w-16 h-px bg-gradient-to-l from-gray-500/80 to-transparent"></div>
                                </div>

                                {/* Layer 2: Cloud (Middle) */}
                                <div className="absolute top-[48%] w-full flex justify-center items-center z-20">
                                    <motion.div
                                        animate={{ y: [0, 8, 0] }}
                                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                                        style={{ rotateX: 65, rotateZ: 45 }}
                                        className="w-32 h-32 md:w-48 md:h-48 border border-neon-cyan bg-neon-cyan/10 backdrop-blur-md shadow-[0_0_40px_rgba(6,182,212,0.25)] flex items-center justify-center absolute hover:bg-neon-cyan/20 transition-colors cursor-pointer"
                                    >
                                        <div className="w-[80%] h-[80%] border border-neon-cyan/40 border-dashed rounded-full flex items-center justify-center bg-black/20">
                                            <CloudLightning size={28} className="text-neon-cyan" />
                                        </div>
                                    </motion.div>

                                    {/* Label Right */}
                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="absolute left-[55%] md:left-[60%] ml-6 md:ml-10 text-left bg-industrial-950/80 border border-neon-cyan/20 py-2 px-3 md:px-4 rounded-xl backdrop-blur-xl shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                                    >
                                        <div className="text-neon-cyan font-mono text-[8px] md:text-[9px] tracking-widest mb-1">CAPA 02</div>
                                        <div className="text-white font-bold text-xs md:text-sm">Data Cloud & BI</div>
                                    </motion.div>
                                    {/* Connection Line */}
                                    <div className="absolute left-[50%] ml-2 md:ml-4 w-8 md:w-16 h-px bg-gradient-to-r from-neon-cyan/80 to-transparent"></div>
                                </div>

                                {/* Layer 3: AI (Top) */}
                                <div className="absolute top-[31%] w-full flex justify-center items-center z-30">
                                    <motion.div
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                        style={{ rotateX: 65, rotateZ: 45 }}
                                        className="w-32 h-32 md:w-48 md:h-48 border border-neon-purple bg-neon-purple/20 backdrop-blur-md shadow-[0_0_50px_rgba(168,85,247,0.35)] flex items-center justify-center absolute hover:bg-neon-purple/30 transition-colors cursor-pointer"
                                    >
                                         <div className="w-[80%] h-[80%] border border-neon-purple/50 border-dashed rounded-full flex items-center justify-center relative bg-black/20">
                                            {/* Pulsing core effect */}
                                            <div className="absolute inset-0 bg-neon-purple/30 blur-xl rounded-full animate-pulse-slow"></div>
                                            <BrainCircuit size={28} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] relative z-10" />
                                         </div>
                                    </motion.div>

                                    {/* Label Left */}
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 }}
                                        className="absolute right-[55%] md:right-[60%] mr-6 md:mr-10 text-right bg-industrial-950/80 border border-neon-purple/20 py-2 px-3 md:px-4 rounded-xl backdrop-blur-xl shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                                    >
                                        <div className="text-neon-purple font-mono text-[8px] md:text-[9px] tracking-widest mb-1">CAPA 03</div>
                                        <div className="text-white font-bold text-xs md:text-sm">IA Cognitiva</div>
                                    </motion.div>
                                    {/* Connection Line */}
                                    <div className="absolute right-[50%] mr-2 md:mr-4 w-8 md:w-16 h-px bg-gradient-to-l from-neon-purple/80 to-transparent"></div>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default About;
