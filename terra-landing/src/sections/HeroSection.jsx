import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <section className="snap-section relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('/bg_hero.png')" }}></div>
        <div className="absolute inset-0 bg-black/25 mix-blend-multiply"></div>
        <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-[#1a1100]/90 to-transparent"></div>
      </div>

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6 md:px-12" style={{ paddingTop: '72px' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="flex flex-col items-center gap-6 w-full max-w-5xl"
        >
          <h1 className="font-headline text-4xl sm:text-5xl md:text-7xl lg:text-[7rem] text-surface-bright font-bold leading-[1.05] tracking-tighter text-center">
            {t('hero.title')}
          </h1>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="font-headline text-sm md:text-xl leading-relaxed text-white/85 font-light tracking-wide text-center max-w-2xl"
          >
            {t('hero.subtitle')}
          </motion.h2>
          <motion.a
            href="#contact"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75, ease: "easeOut" }}
            className="mt-4 md:mt-6 bg-secondary-fixed text-on-secondary-fixed px-6 md:px-10 py-3 md:py-4 text-sm font-bold rounded-full shadow-[0_0_30px_rgba(253,195,77,0.3)] hover:shadow-[0_0_50px_rgba(253,195,77,0.6)] hover:bg-white hover:text-black hover:-translate-y-1 transition-all uppercase tracking-[0.2em] inline-flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined text-xl">handshake</span>
            {t('hero.cta_contact')}
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
