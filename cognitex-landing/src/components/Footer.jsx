import React from 'react';
import { BrainCircuit, Activity, Globe, Shield, MessageCircle, Mail } from 'lucide-react';

const NAV_LINKS = [
    { href: '#about',     key: 'nav_about' },
    { href: '#ecosystem', key: 'nav_ecosystem' },
    { href: '#services',  key: 'nav_services' },
    { href: '#platforms', key: 'nav_platforms' },
];

const PLATFORM_LINKS = [
    { href: 'https://agro.cognitexindustrial.com',      label: 'Agro-Sentinel' },
    { href: 'https://industry.cognitexindustrial.com',  label: 'Industry-Sentinel' },
    { href: 'https://personal.cognitexindustrial.com',  label: 'Personal-Sentinel' },
];

const Footer = ({ t }) => {
    if (!t) return null;

    return (
        <footer className="border-t border-white/5 bg-industrial-950 relative z-10 overflow-hidden">
            {/* Ambient top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-neon-cyan/3 blur-[100px] pointer-events-none" />

            {/* Main footer grid */}
            <div className="max-w-7xl mx-auto px-6 pt-16 pb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">

                {/* Brand column */}
                <div className="lg:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <BrainCircuit size={22} className="text-neon-cyan" />
                        <span className="text-white font-black text-lg tracking-tight">COGNITEX <span className="text-neon-cyan">INDUSTRIAL</span></span>
                    </div>
                    <p className="text-xs font-mono text-gray-500 tracking-[0.25em] uppercase mb-4">{t.tagline}</p>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6">{t.description}</p>
                    {/* Status */}
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        {t.status}
                    </div>
                </div>

                {/* Navigation column */}
                <div>
                    <h6 className="text-white font-bold text-xs tracking-widest uppercase mb-5 flex items-center gap-2">
                        <Globe size={13} className="text-neon-cyan" />
                        {t.nav_title}
                    </h6>
                    <ul className="space-y-3">
                        {NAV_LINKS.map(({ href, key }) => (
                            <li key={key}>
                                <a href={href} className="text-gray-500 text-sm hover:text-white transition-colors flex items-center gap-2 group">
                                    <span className="w-3 h-px bg-gray-700 group-hover:bg-neon-cyan group-hover:w-5 transition-all duration-300" />
                                    {t[key]}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Platforms column */}
                <div>
                    <h6 className="text-white font-bold text-xs tracking-widest uppercase mb-5 flex items-center gap-2">
                        <Activity size={13} className="text-neon-green" />
                        {t.products_title}
                    </h6>
                    <ul className="space-y-3">
                        {PLATFORM_LINKS.map(({ href, label }) => (
                            <li key={label}>
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-500 text-sm hover:text-white transition-colors flex items-center gap-2 group"
                                >
                                    <span className="w-3 h-px bg-gray-700 group-hover:bg-neon-green group-hover:w-5 transition-all duration-300" />
                                    {label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Contact column */}
                <div>
                    <h6 className="text-white font-bold text-xs tracking-widest uppercase mb-5 flex items-center gap-2">
                        <MessageCircle size={13} className="text-neon-purple" />
                        {t.contact_title}
                    </h6>
                    <ul className="space-y-4">
                        <li>
                            <a
                                href="mailto:contact@cognitexindustrial.com"
                                className="flex items-center gap-3 text-gray-500 text-sm hover:text-white transition-colors group"
                            >
                                <Mail size={14} className="text-gray-600 group-hover:text-neon-cyan transition-colors shrink-0" />
                                contact@cognitexindustrial.com
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://wa.me/593996432010"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 text-gray-500 text-sm hover:text-[#25D366] transition-colors group"
                            >
                                <MessageCircle size={14} className="text-gray-600 group-hover:text-[#25D366] transition-colors shrink-0" />
                                WhatsApp
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="max-w-7xl mx-auto px-6 py-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
                <p className="text-gray-600 text-xs font-mono">{t.copyright} | {t.network}</p>
                <div className="flex items-center gap-6 text-xs font-mono text-gray-600">
                    <a href="#" className="hover:text-gray-400 transition-colors flex items-center gap-1.5">
                        <Shield size={11} />{t.privacy}
                    </a>
                    <span className="text-gray-700">·</span>
                    <a href="#" className="hover:text-gray-400 transition-colors">{t.terms}</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
