import React from 'react';
import { MessageCircle, Instagram, Facebook } from 'lucide-react';

const TiktokIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
    </svg>
);

const SocialLinks = () => {
    return (
        <div className="flex flex-col gap-4 mt-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Atención 24/7 y Comunidad</h3>
            <div className="flex flex-wrap gap-4">
                <a
                    href="https://wa.me/numerodetelefono"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#25D366]/20 border border-[#25D366]/50 hover:bg-[#25D366]/30 text-white font-medium transition-all hover:scale-105 group"
                >
                    <MessageCircle className="w-5 h-5 text-[#25D366] group-hover:scale-110 transition-transform" />
                    Asesoría WhatsApp
                </a>

                <a href="#" className="flex items-center justify-center w-12 h-12 rounded-full glass hover:bg-white/10 transition-colors text-slate-300 hover:text-white" title="Instagram">
                    <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="flex items-center justify-center w-12 h-12 rounded-full glass hover:bg-white/10 transition-colors text-slate-300 hover:text-white" title="Facebook">
                    <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="flex items-center justify-center w-12 h-12 rounded-full glass hover:bg-white/10 transition-colors text-slate-300 hover:text-white" title="TikTok">
                    <TiktokIcon />
                </a>
            </div>
        </div>
    );
};

export default SocialLinks;
