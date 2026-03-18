import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const ContactModal = ({ isOpen, onClose, t }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');

        try {
            // Reemplazar la apiKey con el access key real de Web3Forms (puede venir de .env)
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({
                    access_key: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || 'YOUR_ACCESS_KEY_HERE',
                    subject: `Nuevo contacto de ${formData.name} desde Landing Page`,
                    ...formData
                })
            });

            const result = await response.json();
            
            if (result.success) {
                setStatus('success');
                setFormData({ name: '', email: '', message: '' });
                setTimeout(() => {
                    setStatus('idle');
                    onClose();
                }, 3000);
            } else {
                console.error("Error from Web3Forms:", result);
                setStatus('error');
            }
        } catch (error) {
            console.error("Fetch error submitting form:", error);
            setStatus('error');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    ></div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative bg-industrial-900 border border-white/10 rounded-2xl p-8 w-full max-w-lg shadow-2xl overflow-hidden"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                        
                        <h3 className="text-2xl font-black text-white mb-2">{t.modalTitle}</h3>
                        <p className="text-gray-400 mb-6 text-sm">{t.subtitle}</p>

                        {status === 'success' ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center py-8 text-center"
                            >
                                <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                                <h4 className="text-xl font-bold text-white mb-2">¡Mensaje enviado!</h4>
                                <p className="text-gray-400">Nos pondremos en contacto contigo pronto.</p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4 relative">
                                <div>
                                    <label className="block text-xs font-mono text-gray-500 mb-1">{t.name}</label>
                                    <input 
                                        type="text" 
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        disabled={status === 'loading'}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-colors" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-500 mb-1">{t.email}</label>
                                    <input 
                                        type="email" 
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={status === 'loading'}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-colors" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-500 mb-1">{t.message}</label>
                                    <textarea 
                                        rows="4" 
                                        name="message"
                                        required
                                        value={formData.message}
                                        onChange={handleChange}
                                        disabled={status === 'loading'}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-colors"
                                    ></textarea>
                                </div>
                                
                                {status === 'error' && (
                                    <div className="flex items-center gap-2 text-red-400 text-sm mt-2 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                                        <AlertCircle size={16} />
                                        <span>Ha ocurrido un error al enviar el mensaje. Inténtalo más tarde.</span>
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={status === 'loading'}
                                    className="w-full bg-neon-cyan hover:bg-neon-cyan/90 text-black font-bold py-4 rounded-xl mt-6 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {status === 'loading' ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        t.send || 'Enviar Mensaje'
                                    )}
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ContactModal;
