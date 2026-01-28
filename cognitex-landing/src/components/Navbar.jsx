import React from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Languages } from 'lucide-react';
import cognitexLogo from '../assets/cognitex_icon.png';

const Navbar = ({
    t,
    language,
    toggleLanguage,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    setIsContactModalOpen
}) => {
    return (
        <>
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-industrial-950/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-neon-cyan/20 blur-xl rounded-full group-hover:bg-neon-cyan/40 transition-all duration-500"></div>
                            <img src={cognitexLogo} alt="Cognitex Logo" className="w-24 h-24 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]" />
                        </div>
                        <div className="leading-tight">
                            <h1 className="text-2xl font-black tracking-tighter text-white">COGNITEX <span className="text-neon-cyan">INDUSTRIAL</span></h1>
                            <span className="text-[10px] font-mono text-gray-400 tracking-[0.3em] block ml-1">AI SUPERVISION SYSTEMS</span>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-400">
                        <a href="#about" className="hover:text-white transition-colors">{t.about}</a>
                        <a href="#services" className="hover:text-white transition-colors">{t.solutions}</a>
                        <a href="#platforms" className="hover:text-white transition-colors">{t.platforms}</a>

                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                            <Languages size={16} /> {language.toUpperCase()}
                        </button>

                        <button
                            onClick={() => setIsContactModalOpen(true)}
                            className="px-5 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-neon-cyan/50 transition-all text-white"
                        >
                            {t.contact}
                        </button>
                    </div>
                    <button
                        className="md:hidden text-white flex items-center gap-4"
                    >
                        <button onClick={toggleLanguage} className="font-mono font-bold text-xs bg-white/10 px-2 py-1 rounded">{language.toUpperCase()}</button>
                        <div onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </div>
                    </button>
                </div>
            </nav>

            {/* MOBILE MENU */}
            <motion.div
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: isMobileMenuOpen ? 1 : 0, x: isMobileMenuOpen ? 0 : '100%' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed inset-0 z-40 bg-industrial-950/95 backdrop-blur-xl md:hidden pt-24 px-6"
                style={{ pointerEvents: isMobileMenuOpen ? 'auto' : 'none' }}
            >
                <div className="flex flex-col gap-6 text-lg font-bold text-gray-300">
                    <a href="#about" className="hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>{t.about}</a>
                    <a href="#services" className="hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>{t.solutions}</a>
                    <a href="#platforms" className="hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>{t.platforms}</a>
                    <button
                        onClick={() => {
                            setIsMobileMenuOpen(false);
                            setIsContactModalOpen(true);
                        }}
                        className="px-5 py-3 bg-neon-cyan/10 border border-neon-cyan/50 rounded-lg text-neon-cyan"
                    >
                        {t.contact}
                    </button>
                </div>
            </motion.div>
        </>
    );
};

export default Navbar;
