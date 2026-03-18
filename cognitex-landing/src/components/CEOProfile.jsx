import React from 'react';
import { motion } from 'framer-motion';
import { Award, GraduationCap } from 'lucide-react';
import SectionHeader from './common/SectionHeader';

const CEOProfile = ({ translations }) => {
    return (
        <section id="leadership" className="py-24 px-6 relative z-10 bg-industrial-950">
            <div className="max-w-4xl mx-auto relative z-10">
                <SectionHeader 
                    kicker={translations.title}
                    title={translations.role}
                    alignment="center"
                />

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-12 bg-industrial-900/40 border border-white/5 rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto shadow-2xl backdrop-blur-sm"
                >
                    {/* Simple Text Badge instead of an image */}
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-black border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                        <Award size={28} className="text-neon-cyan opacity-80" />
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        Ing. Diego Mosquera MSc.
                    </h2>
                    <p className="text-neon-cyan font-mono text-sm tracking-widest uppercase mb-10 opacity-90">
                        {translations.role}
                    </p>

                    <p className="text-gray-400 font-light leading-relaxed mb-8 hidden md:block">
                        Liderando la innovación tecnológica con un enfoque multidisciplinario en datos, sistemas y automatización industrial.
                    </p>

                    {/* Classic Simple List */}
                    <div className="space-y-4 text-left border-t border-white/5 pt-8">
                        {translations.education.map((item, index) => (
                            <div key={index} className="flex items-start gap-4">
                                <GraduationCap size={20} className="text-gray-500 shrink-0 mt-0.5" />
                                <p className="text-gray-300 font-light leading-relaxed">
                                    {item}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default CEOProfile;
