import { useTranslation } from 'react-i18next';

const SUPPLIER_FEATURES = [
  { icon: 'payments',       tKey: 'sup_f1' },
  { icon: 'verified',       tKey: 'sup_f2' },
  { icon: 'local_shipping', tKey: 'sup_f3' },
  { icon: 'bar_chart',      tKey: 'sup_f4' },
];

const BUYER_FEATURES = [
  { icon: 'location_on', tKey: 'buy_f1' },
  { icon: 'lab_profile', tKey: 'buy_f2' },
  { icon: 'package_2',   tKey: 'buy_f3' },
  { icon: 'balance',     tKey: 'buy_f4' },
];

const NetworkSection = () => {
  const { t } = useTranslation();

  return (
    <section className="snap-section bg-[#050300] text-white relative overflow-hidden">

      {/* Fondo atmosférico */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-0 top-0 w-1/2 h-full bg-gradient-to-r from-amber-900/25 to-transparent"></div>
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-emerald-900/25 to-transparent"></div>
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent -translate-x-1/2"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>

      {/* Título mobile */}
      <div className="lg:hidden relative z-20 text-center px-4 pt-[calc(72px+1rem)] pb-3">
        <span className="font-label text-white/40 tracking-[0.4em] uppercase text-[10px] block mb-1 font-bold">{t('network.ecosystem')}</span>
        <h2 className="font-headline text-xl font-bold tracking-tight">
          {t('network.title1')}<span className="text-secondary-fixed">{t('network.title2')}</span>
        </h2>
      </div>
      {/* Título desktop */}
      <div className="hidden lg:block absolute top-0 left-0 right-0 text-center z-20" style={{ paddingTop: 'calc(72px + 36px)' }}>
        <span className="font-label text-white/40 tracking-[0.4em] uppercase text-xs block mb-1 font-bold">{t('network.ecosystem')}</span>
        <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight mb-1">
          {t('network.title1')}<span className="text-secondary-fixed">{t('network.title2')}</span>
        </h2>
      </div>

      {/* Nodo central */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
        <div className="absolute inset-0 w-24 h-24 -ml-12 -mt-12 rounded-full border border-secondary-fixed/20 animate-ping" style={{ animationDuration: '3s' }}></div>
        <div className="absolute inset-0 w-16 h-16 -ml-8 -mt-8 rounded-full border border-secondary-fixed/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
        <div className="w-14 h-14 -ml-7 -mt-7 absolute rounded-full bg-[#0a0700] border-2 border-secondary-fixed shadow-[0_0_30px_rgba(253,195,77,0.5)] flex items-center justify-center">
          <span className="material-symbols-outlined text-secondary-fixed text-xl">swap_horiz</span>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-7 w-16 h-px bg-gradient-to-r from-amber-500/60 to-transparent hidden lg:block"></div>
        <div className="absolute top-1/2 -translate-y-1/2 left-7 w-16 h-px bg-gradient-to-l from-emerald-500/60 to-transparent hidden lg:block"></div>
      </div>

      {/* Layout split */}
      <div className="flex flex-col lg:flex-row w-full h-full">

        {/* PROVEEDORES */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-5 lg:px-12 xl:px-16 py-4 lg:py-12 relative h-1/2 lg:h-full overflow-y-auto lg:overflow-hidden">
          <div className="inline-flex items-center gap-2 mb-2 self-start mt-2 lg:mt-0">
            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
            <span className="font-label text-amber-500/80 tracking-[0.3em] uppercase text-[10px] md:text-xs font-bold">{t('network.badge_supplier')}</span>
          </div>

          <h3 className="font-headline text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 leading-tight">
            {t('network.sup_title1')}<span className="text-amber-400 italic font-light">{t('network.sup_title2')}</span>{t('network.sup_title3')}
          </h3>
          <p className="text-white/70 font-light text-sm md:text-base leading-relaxed mb-5 max-w-xl">
            {t('network.sup_desc')}
          </p>

          <ul className="space-y-3 mb-5">
            {SUPPLIER_FEATURES.map(({ icon, tKey }) => (
              <li key={tKey} className="flex items-start gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-amber-500/50 transition-colors">
                  <span className="material-symbols-outlined text-amber-400 text-xl">{icon}</span>
                </div>
                <div>
                  <span className="block text-white text-sm md:text-base font-bold mb-1">{t(`network.${tKey}_t`)}</span>
                  <span className="text-white/60 text-xs md:text-sm font-light">{t(`network.${tKey}_d`)}</span>
                </div>
              </li>
            ))}
          </ul>

          <a href="#contact" className="inline-flex items-center gap-2 self-start bg-amber-500 text-black px-5 py-2.5 rounded-full font-bold text-sm mt-2 uppercase tracking-wider hover:bg-amber-400 hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all">
            <span className="material-symbols-outlined text-base">agriculture</span>
            {t('network.sup_cta')}
          </a>
        </div>

        {/* COMPRADORES */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 lg:px-12 xl:px-16 py-6 lg:py-12 relative h-1/2 lg:h-full border-t lg:border-t-0 lg:border-l border-white/5 overflow-y-auto lg:overflow-hidden">
          <div className="inline-flex items-center gap-2 mb-3 self-start">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
            <span className="font-label text-emerald-400/80 tracking-[0.3em] uppercase text-xs md:text-sm font-bold">{t('network.badge_buyer')}</span>
          </div>

          <h3 className="font-headline text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
            {t('network.buy_title1')}<span className="text-emerald-400 italic font-light">{t('network.buy_title2')}</span>{t('network.buy_title3')}
          </h3>
          <p className="text-white/70 font-light text-sm md:text-base leading-relaxed mb-5 max-w-xl">
            {t('network.buy_desc')}
          </p>

          <ul className="space-y-3 mb-5">
            {BUYER_FEATURES.map(({ icon, tKey }) => (
              <li key={tKey} className="flex items-start gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-emerald-500/50 transition-colors">
                  <span className="material-symbols-outlined text-emerald-400 text-xl">{icon}</span>
                </div>
                <div>
                  <span className="block text-white text-sm md:text-base font-bold mb-1">{t(`network.${tKey}_t`)}</span>
                  <span className="text-white/60 text-xs md:text-sm font-light">{t(`network.${tKey}_d`)}</span>
                </div>
              </li>
            ))}
          </ul>

          <a href="#contact" className="inline-flex items-center gap-2 self-start bg-transparent border border-emerald-500 text-emerald-400 px-5 py-2.5 rounded-full font-bold text-sm mt-2 uppercase tracking-wider hover:bg-emerald-500 hover:text-black hover:shadow-[0_0_25px_rgba(52,211,153,0.3)] transition-all">
            <span className="material-symbols-outlined text-base">search</span>
            {t('network.buy_cta')}
          </a>
        </div>

      </div>
    </section>
  );
};

export default NetworkSection;
