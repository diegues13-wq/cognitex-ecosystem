import React from 'react';
import { MessageCircle, Instagram, Facebook } from 'lucide-react';

const TiktokIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"></path>
    </svg>
);

const SocialLinks = () => {
    return (
        <div id="soporte" className="bg-white rounded-2xl shadow-soft p-8 w-full border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col gap-2 text-center md:text-left">
                <h3 className="text-xl font-bold text-slate-900">¿Necesitas ayuda con tu envío?</h3>
                <p className="text-slate-600">Nuestro equipo de soporte está disponible 24/7 en WhatsApp y redes sociales.</p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-end gap-3">
                <a
                    href="https://wa.me/numerodetelefono"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold transition-all shadow-md shadow-[#25D366]/20"
                >
                    <MessageCircle className="w-5 h-5" />
                    Contactar Soporte
                </a>

                <div className="flex gap-2">
                    <a href="#" className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700" title="Instagram">
                        <Instagram className="w-5 h-5" />
                    </a>
                    <a href="#" className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700" title="Facebook">
                        <Facebook className="w-5 h-5" />
                    </a>
                    <a href="#" className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700" title="TikTok">
                        <TiktokIcon />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default SocialLinks;
