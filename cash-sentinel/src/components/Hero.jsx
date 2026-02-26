import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, ShieldCheck } from 'lucide-react';

const Hero = ({ t }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6 text-white"
        >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                {t('sendMoneyTo')} <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-emerald-300">{t('russia')}</span> <span className="font-light text-blue-200">{t('and')}</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-blue-300">{t('ecuador')}</span> <br />
                <span className="text-blue-100 text-3xl sm:text-4xl">{t('fastAndSecure')}</span>
            </h2>

            <p className="text-lg text-blue-100 max-w-xl leading-relaxed mt-2 font-medium">
                {t('heroSubtitle')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="flex items-start gap-3 bg-white/10 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-white/20">
                    <Zap className="w-8 h-8 text-emerald-400 shrink-0" />
                    <div>
                        <h4 className="font-bold text-white">{t('liveUpdate')}</h4>
                        <p className="text-sm text-blue-100 mt-1">{t('liveUpdateDesc')}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3 bg-white/10 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-white/20">
                    <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                    <div>
                        <h4 className="font-bold text-white">{t('secure100')}</h4>
                        <p className="text-sm text-blue-100 mt-1">{t('secure100Desc')}</p>
                    </div>
                </div>
            </div>

            <ul className="flex flex-col gap-3 mt-4">
                <li className="flex items-center text-blue-100 font-medium tracking-wide">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mr-2 shrink-0" />
                    {t('lowCommission')}
                </li>
                <li className="flex items-center text-blue-100 font-medium tracking-wide">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mr-2 shrink-0" />
                    {t('whatsappSupport')}
                </li>
            </ul>
        </motion.div>
    );
};

export default Hero;
