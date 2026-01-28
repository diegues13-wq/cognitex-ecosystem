import { motion } from 'framer-motion';
import { Award, GraduationCap, Phone, User } from 'lucide-react';

const CEOProfile = ({ translations }) => {
    return (
        <section className="py-20 px-6 relative z-10 bg-black/20">
            <div className="max-w-5xl mx-auto">
                <h3 className="text-3xl font-black text-white mb-12 text-center flex items-center justify-center gap-3">
                    <Award className="text-neon-cyan" size={32} />
                    {translations.title}
                </h3>

                <div className="bg-industrial-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-sm flex flex-col md:flex-row gap-8 items-center">
                    {/* Avatar Placeholder */}
                    <div className="flex-shrink-0 relative group">
                        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-4 border-neon-cyan/20 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                            <User size={64} className="text-gray-500" />
                        </div>
                        <div className="absolute inset-0 rounded-full border-4 border-neon-cyan/50 animate-pulse-slow"></div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h4 className="text-3xl font-bold text-white mb-2">Ing. Diego Mosquera MSc.</h4>
                        <p className="text-neon-cyan font-mono font-bold tracking-widest text-sm mb-6">{translations.role}</p>

                        <div className="space-y-3 mb-6">
                            {translations.education.map((item, index) => (
                                <div key={index} className="flex items-center gap-3 text-gray-300 text-sm">
                                    <GraduationCap size={18} className="text-neon-purple flex-shrink-0" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 justify-center md:justify-start">
                            <a
                                href="https://wa.me/593996432010"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600/20 border border-emerald-500/50 rounded-xl text-emerald-400 font-bold hover:bg-emerald-600/30 transition-all"
                            >
                                <Phone size={18} />
                                +593 99 643 2010
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CEOProfile;
