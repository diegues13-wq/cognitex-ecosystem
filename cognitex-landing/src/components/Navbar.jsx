import React from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Languages, MessageCircle } from 'lucide-react';
import cognitexLogo from '../assets/cognitex_icon.png';

const Navbar = ({
    t,
    language,
    toggleLanguage,
    isMobileMenuOpen,
    setIsMobileMenuOpen
}) => {
    const waMessage = language === 'en' 
        ? "Hello, I would like to get more information about Cognitex Industrial's services." 
        : "Hola, me gustaría obtener más información sobre los servicios de Cognitex Industrial.";
    const waUrl = `https://wa.me/593996432010?text=${encodeURIComponent(waMessage)}`;

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
                        <a href="#ecosystem" className="hover:text-white transition-colors">{t.ecosystem}</a>
                        <a href="#services" className="hover:text-white transition-colors">{t.solutions}</a>
                        <a href="#platforms" className="hover:text-white transition-colors">{t.platforms}</a>

                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                            <Languages size={16} /> {language.toUpperCase()}
                        </button>

                        <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-2 bg-[#25D366]/20 border border-[#25D366]/50 rounded-lg hover:bg-[#25D366]/30 transition-all text-[#25D366] font-bold"
                        >
                            <MessageCircle size={16} />
                            {t.contact}
                        </a>
                    </div>
                    <div
                        className="md:hidden text-white flex items-center gap-4"
                    >
                        <button onClick={toggleLanguage} className="font-mono font-bold text-xs bg-white/10 px-2 py-1 rounded">{language.toUpperCase()}</button>
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
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
                    <a href="#ecosystem" className="hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>{t.ecosystem}</a>
                    <a href="#services" className="hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>{t.solutions}</a>
                    <a href="#platforms" className="hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>{t.platforms}</a>
                    <a
                        href="https://wa.me/593996432010"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex justify-center items-center gap-2 px-5 py-3 bg-[#25D366]/20 border border-[#25D366]/50 rounded-lg text-[#25D366] font-bold"
                    >
                        <MessageCircle size={20} />
                        {t.contact}
                    </a>
                </div>
            </motion.div>
        </>
    );
};

export default Navbar;
