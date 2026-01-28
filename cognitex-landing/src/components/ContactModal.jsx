import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const ContactModal = ({ isOpen, onClose, t }) => {
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
                        className="relative bg-industrial-900 border border-white/10 rounded-2xl p-8 w-full max-w-lg shadow-2xl"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-2xl font-black text-white mb-2">{t.modalTitle}</h3>
                        <p className="text-gray-400 mb-6 text-sm">{t.subtitle}</p>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-500 mb-1">{t.name}</label>
                                <input type="text" className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50" />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-500 mb-1">{t.email}</label>
                                <input type="email" className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50" />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-500 mb-1">{t.message}</label>
                                <textarea rows="4" className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50"></textarea>
                            </div>
                            <button type="button" className="w-full bg-neon-cyan hover:bg-neon-cyan/90 text-black font-bold py-4 rounded-xl mt-4 transition-colors">
                                {t.send}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ContactModal;
