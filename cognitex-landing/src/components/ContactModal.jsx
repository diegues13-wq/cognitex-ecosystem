import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Loader2, MessageCircle } from 'lucide-react';

const ContactModal = ({ isOpen, onClose, t, language }) => {
    const [formData, setFormData] = useState({ name: '', company: '', email: '', message: '' });
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    access_key: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || '',
                    subject: `[Cognitex Industrial] Nuevo requerimiento de ${formData.name} — ${formData.company}`,
                    from_name: formData.name,
                    ...formData,
                })
            });
            const result = await response.json();
            if (result.success) {
                setStatus('success');
                setFormData({ name: '', company: '', email: '', message: '' });
                setTimeout(() => { setStatus('idle'); onClose(); }, 4000);
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
    };

    const waMessage = language === 'en'
        ? "Hello, I would like to get more information about Cognitex Industrial's services."
        : "Hola, me gustaría obtener más información sobre los servicios de Cognitex Industrial.";
    const waUrl = `https://wa.me/593996432010?text=${encodeURIComponent(waMessage)}`;

    const inputClass = "w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan/60 focus:ring-1 focus:ring-neon-cyan/30 transition-all text-sm";

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="relative bg-industrial-900 border border-white/10 rounded-2xl p-8 w-full max-w-lg shadow-[0_0_80px_rgba(6,182,212,0.1)] overflow-hidden"
                    >
                        {/* Ambient glow */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-neon-cyan/5 rounded-full blur-[60px] pointer-events-none" />

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-xl md:text-2xl font-black text-white mb-1 pr-8">{t.modalTitle}</h3>
                        <p className="text-gray-500 mb-6 text-sm leading-relaxed">{t.subtitle}</p>

                        {status === 'success' ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center py-10 text-center gap-4"
                            >
                                <div className="w-16 h-16 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                                    <CheckCircle2 className="w-8 h-8 text-neon-green" />
                                </div>
                                <h4 className="text-xl font-bold text-white">{t.success_title}</h4>
                                <p className="text-gray-400 text-sm max-w-xs">{t.success_msg}</p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-mono text-gray-500 mb-1.5 tracking-widest">{t.name}</label>
                                        <input
                                            type="text" name="name" required
                                            value={formData.name} onChange={handleChange}
                                            disabled={status === 'loading'}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-mono text-gray-500 mb-1.5 tracking-widest">{t.company}</label>
                                        <input
                                            type="text" name="company"
                                            value={formData.company} onChange={handleChange}
                                            disabled={status === 'loading'}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-mono text-gray-500 mb-1.5 tracking-widest">{t.email}</label>
                                    <input
                                        type="email" name="email" required
                                        value={formData.email} onChange={handleChange}
                                        disabled={status === 'loading'}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-mono text-gray-500 mb-1.5 tracking-widest">{t.message}</label>
                                    <textarea
                                        rows="4" name="message" required
                                        value={formData.message} onChange={handleChange}
                                        disabled={status === 'loading'}
                                        className={`${inputClass} resize-none`}
                                    />
                                </div>

                                {status === 'error' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-start gap-2 text-red-400 text-xs bg-red-400/10 p-3 rounded-xl border border-red-400/20"
                                    >
                                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                        <span>{t.error_msg}</span>
                                    </motion.div>
                                )}

                                <div className="flex flex-col gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="w-full bg-neon-cyan hover:bg-white text-black font-black py-4 rounded-xl tracking-wider uppercase text-sm transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(6,182,212,0.25)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)]"
                                    >
                                        {status === 'loading' ? (
                                            <><Loader2 size={18} className="animate-spin" /> {t.loading}</>
                                        ) : t.send}
                                    </button>
                                    <a
                                        href={waUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-3 rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#25D366]/20 transition-all"
                                    >
                                        <MessageCircle size={16} />
                                        {t.whatsapp}
                                    </a>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ContactModal;
