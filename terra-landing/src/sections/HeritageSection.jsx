import { useTranslation } from 'react-i18next';

const HeritageSection = () => {
  const { t } = useTranslation();

  return (
    <section id="heritage" className="snap-section bg-[#0a0700] relative overflow-hidden">

      {/* Eje Latitud Cero — solo desktop */}
      <div className="hidden lg:flex absolute left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-secondary-fixed to-transparent -translate-x-1/2 z-20 shadow-[0_0_15px_#fdc34d]"></div>
      <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-black border border-secondary-fixed/50 rounded-full w-24 h-24 lg:w-32 lg:h-32 flex-col items-center justify-center shadow-[0_0_40px_rgba(253,195,77,0.3)]">
        <span className="font-label text-secondary-fixed tracking-[0.2em] text-xs md:text-sm">{t('heritage_ui.lat_label')}</span>
        <span className="font-headline text-white font-bold text-2xl md:text-3xl lg:text-4xl">0°0'0"</span>
      </div>

      {/* Columnas */}
      <div className="flex flex-col lg:flex-row w-full h-full">
        {/* CAFÉ */}
        <div className="w-full lg:w-1/2 relative group flex flex-col justify-end h-1/2 lg:h-full overflow-y-auto lg:overflow-hidden">
          <div className="absolute inset-0 bg-black z-0">
            <div className="absolute inset-0 bg-[url('/bg_coffee_legend.webp')] bg-cover bg-center mix-blend-luminosity opacity-40 group-hover:scale-105 transition-transform duration-1000"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
            <div className="absolute inset-0 bg-amber-600/20 mix-blend-multiply"></div>
          </div>
          <div className="relative z-10 max-w-sm md:max-w-lg xl:max-w-2xl p-4 md:p-8 lg:p-10 xl:p-14" style={{ paddingTop: 'calc(72px + 2rem)' }}>
            <h2 className="font-headline text-xl font-bold text-surface-bright tracking-tight mb-3 lg:hidden">{t('heritage.title')}</h2>
            <span className="font-label text-white/60 tracking-[0.3em] uppercase text-[10px] md:text-xs block mb-2 font-semibold">{t('heritage_ui.export_bean')}</span>
            <h3 className="font-headline text-base md:text-lg lg:text-2xl font-bold mb-2 text-white">
              {t('heritage_ui.coffee_title')} <span className="italic text-amber-500 font-light">{t('heritage_ui.coffee_hl')}</span>
            </h3>
            <p className="font-body text-white/80 font-light text-xs leading-relaxed mb-3 block md:hidden">
              {t('heritage.coffee_short')}
            </p>
            <p className="font-body text-white/75 font-light text-sm leading-relaxed mb-4 hidden md:block">
              {t('heritage.coffee_desc_es')}
            </p>
            <ul className="grid grid-cols-2 gap-2 text-[10px] md:text-xs font-label uppercase tracking-wider text-white/60">
              <li className="border-l border-amber-600/50 pl-2 py-1"><span className="block text-white font-bold mb-0.5 text-[10px] md:text-xs">{t('heritage_ui.env')}</span>{t('heritage_ui.env_coffee')}</li>
              <li className="border-l border-amber-600/50 pl-2 py-1"><span className="block text-white font-bold mb-0.5 text-[10px] md:text-xs">{t('heritage_ui.proc')}</span>{t('heritage_ui.proc_coffee')}</li>
              <li className="border-l border-amber-600/50 pl-2 py-1"><span className="block text-white font-bold mb-0.5 text-[10px] md:text-xs">{t('heritage_ui.maturation')}</span>{t('heritage_ui.maturation_coffee')}</li>
              <li className="border-l border-amber-600/50 pl-2 py-1"><span className="block text-white font-bold mb-0.5 text-[10px] md:text-xs">{t('heritage_ui.profile')}</span>{t('heritage_ui.profile_coffee')}</li>
            </ul>
          </div>
        </div>

        {/* CACAO */}
        <div className="w-full lg:w-1/2 relative group flex flex-col justify-end h-1/2 lg:h-full border-t lg:border-t-0 border-white/10 lg:border-l overflow-y-auto lg:overflow-hidden">
          <div className="absolute inset-0 bg-black z-0">
            <div className="absolute inset-0 bg-[url('/bg_cacao_legend.webp')] bg-cover bg-center mix-blend-luminosity opacity-40 group-hover:scale-105 transition-transform duration-1000"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#010a05] via-[#021f0f]/90 to-transparent"></div>
            <div className="absolute inset-0 bg-emerald-500/15 mix-blend-color"></div>
          </div>
          <div className="relative z-10 max-w-xl lg:max-w-lg xl:max-w-2xl self-end lg:text-right p-4 md:p-8 lg:p-10 xl:p-14">
            <span className="font-label text-emerald-200/60 tracking-[0.3em] uppercase text-[10px] md:text-xs block mb-2 font-bold">{t('heritage_ui.fruit_origin')}</span>
            <h3 className="font-headline text-base md:text-lg lg:text-2xl font-bold mb-2 text-white">
              {t('heritage_ui.cacao_title')} <span className="text-emerald-400 italic font-light">{t('heritage_ui.cacao_hl')}</span>
            </h3>
            <p className="font-body text-white/80 font-light text-xs leading-relaxed mb-3 block md:hidden">
              {t('heritage.cacao_short')}
            </p>
            <p className="font-body text-white/75 font-light text-sm leading-relaxed mb-4 hidden md:block">
              {t('heritage.cacao_desc_es')}
            </p>
            <ul className="grid grid-cols-2 gap-2 text-[10px] md:text-xs font-label uppercase tracking-wider text-emerald-100/60 lg:text-right">
              <li className="border-l lg:border-l-0 lg:border-r border-emerald-500/50 pl-2 lg:pl-0 lg:pr-3 py-1"><span className="block text-white font-bold mb-0.5 text-[10px] md:text-xs">{t('heritage_ui.env')}</span>{t('heritage_ui.env_cacao')}</li>
              <li className="border-l lg:border-l-0 lg:border-r border-emerald-500/50 pl-2 lg:pl-0 lg:pr-3 py-1"><span className="block text-white font-bold mb-0.5 text-[10px] md:text-xs">{t('heritage_ui.classi')}</span>{t('heritage_ui.classi_cacao')}</li>
              <li className="border-l lg:border-l-0 lg:border-r border-emerald-500/50 pl-2 lg:pl-0 lg:pr-3 py-1"><span className="block text-white font-bold mb-0.5 text-[10px] md:text-xs">{t('heritage_ui.agri')}</span>{t('heritage_ui.agri_cacao')}</li>
              <li className="border-l lg:border-l-0 lg:border-r border-emerald-500/50 pl-2 lg:pl-0 lg:pr-3 py-1"><span className="block text-white font-bold mb-0.5 text-[10px] md:text-xs">{t('heritage_ui.craft')}</span>{t('heritage_ui.craft_cacao')}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeritageSection;
