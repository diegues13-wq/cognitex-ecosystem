import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const LogisticsSection = () => {
  const { t } = useTranslation();

  return (
    <section className="snap-section bg-[#020100] text-white relative overflow-hidden flex-col">
      {/* Keyframe .anim-path está definido en global.css */}

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary-fixed/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute inset-0 blueprint-pattern opacity-[0.03]"></div>

      <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-16 relative z-10 flex flex-col justify-center w-full h-full">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center w-full max-w-4xl mx-auto mb-6 pt-[calc(72px+1.5rem)]"
        >
          <span className="font-label text-secondary-fixed/80 tracking-[0.4em] uppercase text-xs md:text-sm block mb-4 font-bold">{t('logistics.label')}</span>
          <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-surface-bright tracking-tight mb-4">
            {t('logistics.title')}
          </h2>
          <p className="font-body text-sm md:text-base text-white/80 leading-relaxed font-light mx-auto max-w-2xl">
            {t('logistics.desc')}
          </p>
        </motion.div>

        <div className="flex flex-col w-full gap-4">
          {/* Mapa de rutas */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1 }}
            className="w-full glass-card p-3 md:p-5 border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.8)] relative max-w-5xl mx-auto"
          >
            <div className="bg-black h-[180px] md:h-[300px] lg:h-[380px] rounded-xl md:rounded-2xl relative overflow-hidden flex items-center justify-center border border-white/5">
              <img className="w-full h-full object-cover opacity-70 mix-blend-screen brightness-110 contrast-130 saturate-50" src="/world_map.jpg" alt="Mapa Mundial Logístico" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 pointer-events-none"></div>

              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 500" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fdc34d" stopOpacity="1" />
                    <stop offset="50%" stopColor="#34d399" stopOpacity="1" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0.4" />
                  </linearGradient>
                  <filter id="glowRoute" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <path d="M 250, 300 Q 200, 230 220, 195" fill="none" stroke="url(#routeGradient)" strokeWidth="3" strokeDasharray="8,4" className="anim-path" filter="url(#glowRoute)" />
                <path d="M 250, 300 Q 380, 200 510, 175" fill="none" stroke="url(#routeGradient)" strokeWidth="3" strokeDasharray="8,4" className="anim-path" filter="url(#glowRoute)" />
                <path d="M 250, 300 Q 430, 120 575, 145" fill="none" stroke="url(#routeGradient)" strokeWidth="3" strokeDasharray="8,4" className="anim-path" filter="url(#glowRoute)" />
                <path d="M 250, 300 Q 560, 390 795, 195" fill="none" stroke="url(#routeGradient)" strokeWidth="3" strokeDasharray="8,4" className="anim-path" filter="url(#glowRoute)" />
              </svg>

              {/* Nodo Ecuador */}
              <div className="absolute w-6 h-6 bg-secondary-fixed shadow-[0_0_30px_#fdc34d,0_0_60px_#fdc34d80] flex items-center justify-center rounded-full z-10" style={{ left: '25%', top: '60%' }}>
                <div className="w-10 h-10 border border-secondary-fixed/80 rounded-full animate-ping absolute"></div>

                <div className="absolute w-4 h-4 bg-emerald-300 shadow-[0_0_20px_#34d399,0_0_40px_#34d39960] rounded-full z-10 hover:scale-150 transition-all cursor-pointer group" style={{ left: '22%', top: '39%' }}>
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 text-[10px] font-mono border border-emerald-500/40 rounded whitespace-nowrap">New York, USA</div>
                </div>
                <div className="absolute w-4 h-4 bg-emerald-300 shadow-[0_0_20px_#34d399,0_0_40px_#34d39960] rounded-full z-10 hover:scale-150 transition-all cursor-pointer group" style={{ left: '51%', top: '35%' }}>
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 text-[10px] font-mono border border-emerald-500/40 rounded whitespace-nowrap">Roma, Italia</div>
                </div>
                <div className="absolute w-4 h-4 bg-emerald-300 shadow-[0_0_20px_#34d399,0_0_40px_#34d39960] rounded-full z-10 hover:scale-150 transition-all cursor-pointer group" style={{ left: '57.5%', top: '29%' }}>
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 text-[10px] font-mono border border-emerald-500/40 rounded whitespace-nowrap">Moscú, Rusia</div>
                </div>
                <div className="absolute w-4 h-4 bg-emerald-300 shadow-[0_0_20px_#34d399,0_0_40px_#34d39960] rounded-full z-10 hover:scale-150 transition-all cursor-pointer group" style={{ left: '79.5%', top: '39%' }}>
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 text-[10px] font-mono border border-emerald-500/40 rounded whitespace-nowrap">Beijing, China</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Hub Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 w-full max-w-5xl mx-auto md:-mt-10 relative z-20 px-4 md:px-0">
            {[
              { icon: 'flight_takeoff', key: 'hub_na', delay: 0.1 },
              { icon: 'account_balance', key: 'hub_eu', delay: 0.3 },
              { icon: 'language',        key: 'hub_as', delay: 0.5 },
            ].map(({ icon, key, delay }) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay }}
                className="bg-[#050300]/95 backdrop-blur-xl border border-white/5 md:border-white/10 rounded-xl p-4 md:p-5 hover:bg-[#0a0700] hover:border-emerald-500/40 hover:-translate-y-1 transition-all shadow-xl flex flex-col gap-2 group"
              >
                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                    <span className="material-symbols-outlined text-xl">{icon}</span>
                  </div>
                  <h4 className="font-headline font-bold text-base md:text-lg text-white">{t(`logistics.${key}`)}</h4>
                </div>
                <p className="text-white/80 text-xs md:text-sm font-light leading-relaxed mt-2">{t(`logistics.${key}_desc`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LogisticsSection;
