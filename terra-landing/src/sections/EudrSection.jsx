import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const EUDR_CARDS = [
  { icon: 'location_on',    key: 'card1', delay: 0.1 },
  { icon: 'history_edu',    key: 'card2', delay: 0.3 },
  { icon: 'nature_people',  key: 'card3', delay: 0.5 },
];

const EudrSection = () => {
  const { t } = useTranslation();

  return (
    <section id="sustainability" className="snap-section bg-[#0a0700] relative px-4 md:px-10 flex-col justify-center overflow-hidden">
      <div className="absolute top-0 left-0 w-32 h-32 opacity-[0.05]">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <path d="M0 0 L100 100 M0 100 L100 0" stroke="currentColor" strokeWidth="0.5"></path>
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="flex flex-col items-center text-center mb-4 pt-[calc(72px+1rem)] max-w-screen-xl mx-auto w-full"
      >
        <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-surface-bright tracking-tight mb-4">
          {t('eudr.title')}
        </h2>
        <p className="font-body text-xs md:text-sm text-white/75 leading-relaxed font-light max-w-2xl text-center mx-auto">
          {t('eudr.desc')}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 relative z-10 w-full max-w-screen-xl mx-auto">
        {EUDR_CARDS.map(({ icon, key, delay }) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay }}
            className="bg-[#130E07] p-4 md:p-5 rounded-2xl hover:bg-[#1a1308] transition-all border border-white/5 hover:border-emerald-500/30 shadow-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] hover:-translate-y-1 flex flex-col items-center text-center group"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <h4 className="font-headline font-bold text-surface-bright text-base md:text-lg mb-2">{t(`eudr.${key}_title`)}</h4>
            <p className="text-xs md:text-sm text-white/75 leading-relaxed font-light">{t(`eudr.${key}_desc`)}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default EudrSection;
