import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const BOTANICAL_ATLAS_COORDS = {
  pichincha: { top: "28%", left: "50%" },
  manabi:    { top: "35%", left: "5%"  },
  losrios:   { top: "50%", left: "25%" },
  amazonia:  { top: "40%", left: "68%" },
  loja:      { top: "92%", left: "40%" },
};

const AtlasSection = () => {
  const { t } = useTranslation();
  const [activeRegion, setActiveRegion] = useState("pichincha");
  const [productIndex, setProductIndex] = useState(0);

  const BOTANICAL_ATLAS = t('botanical_atlas', { returnObjects: true }) || {};
  Object.keys(BOTANICAL_ATLAS_COORDS).forEach(key => {
    if (BOTANICAL_ATLAS[key]) {
      BOTANICAL_ATLAS[key].coords = BOTANICAL_ATLAS_COORDS[key];
    }
  });

  const handleRegionChange = (key) => {
    setActiveRegion(key);
    setProductIndex(0);
  };

  return (
    <section id="products" className="snap-section bg-[#0a0700] border-y border-white/5 flex-col">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mb-2 text-center max-w-screen-2xl mx-auto px-6 md:px-12 relative z-20 pt-[calc(72px+2rem)]"
      >
        <h2 className="font-headline text-4xl md:text-5xl font-bold text-surface-bright tracking-tight mb-2">{t('products.title')}</h2>
      </motion.div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 w-full flex-1 bg-black/40 backdrop-blur-md relative z-10" style={{ minHeight: 0 }}>

        {/* MAPA CARTOGRÁFICO */}
        <div className="flex lg:col-span-4 relative bg-black overflow-hidden flex-col items-center justify-center h-[220px] lg:h-full shrink-0">
          <div className="absolute inset-0 opacity-[0.85] mix-blend-screen pointer-events-none z-10" style={{ backgroundImage: "url('/ecuador_radar.png')", backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:3rem_3rem] z-0"></div>

          <div className="absolute inset-0 z-0 opacity-70 mix-blend-screen pointer-events-none">
            <div className="absolute top-[25%] left-[10%] w-[40%] h-[50%] bg-amber-600/20 blur-[60px] rounded-full transform -rotate-12"></div>
            <div className="absolute top-[10%] left-[35%] w-[30%] h-[80%] bg-secondary-fixed/20 blur-[50px] rounded-full"></div>
            <div className="absolute top-[30%] right-[10%] w-[40%] h-[60%] bg-emerald-500/20 blur-[70px] rounded-full"></div>
          </div>

          {/* Etiquetas HUD — solo desktop */}
          <div className="absolute top-[35%] left-[2%] flex items-center gap-2 z-10 pointer-events-none opacity-80 hidden lg:flex">
            <span className="w-6 h-[1px] bg-amber-600/70"></span>
            <span className="font-mono text-[10px] text-amber-500 uppercase tracking-[0.2em] bg-black/80 px-2 py-1 rounded border border-amber-600/30">{t('atlas_ui.costa')}</span>
          </div>
          <div className="absolute top-[15%] left-[45%] flex flex-col items-center gap-2 z-10 pointer-events-none opacity-90 hidden lg:flex">
            <span className="font-mono text-[10px] text-secondary-fixed uppercase tracking-[0.2em] bg-black/80 px-2 py-1 rounded border border-secondary-fixed/30 shadow-[0_0_10px_rgba(253,195,77,0.2)]">{t('atlas_ui.sierra')}</span>
            <span className="w-[1px] h-6 bg-secondary-fixed/70"></span>
          </div>
          <div className="absolute bottom-[30%] right-[2%] flex items-center gap-2 z-10 pointer-events-none opacity-80 hidden lg:flex">
            <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-[0.2em] bg-black/80 px-2 py-1 rounded border border-emerald-400/30">{t('atlas_ui.amazonia')}</span>
            <span className="w-6 h-[1px] bg-emerald-400/70"></span>
          </div>

          <div className="absolute top-3 left-3 text-[9px] text-white/30 uppercase tracking-widest font-mono z-10 hidden md:block">{t('atlas_ui.tracker')}</div>

          <div className="relative w-full h-full max-w-[400px] max-h-[400px] aspect-square flex items-center justify-center scale-75 sm:scale-90 lg:scale-100">
            {Object.keys(BOTANICAL_ATLAS).map((key) => {
              const isActive = activeRegion === key;
              return (
                <button
                  key={key}
                  onClick={() => handleRegionChange(key)}
                  className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full flex items-center justify-center group focus:outline-none z-20 transition-all hover:z-30 hover:scale-110 active:scale-95"
                  style={{ top: BOTANICAL_ATLAS[key].coords.top, left: BOTANICAL_ATLAS[key].coords.left }}
                  aria-label={`Seleccionar ${BOTANICAL_ATLAS[key].name}`}
                >
                  <div className={`relative w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-secondary-fixed shadow-[0_0_25px_rgba(253,195,77,1)]' : 'bg-emerald-500/80 group-hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.8)]'}`}>
                    {isActive && <div className="absolute w-12 h-12 rounded-full border border-secondary-fixed animate-ping opacity-70"></div>}
                    {!isActive && <div className="absolute w-8 h-8 rounded-full border border-emerald-500/50 group-hover:border-emerald-400 scale-0 group-hover:scale-100 transition-transform duration-300"></div>}
                  </div>
                  <span className={`absolute left-8 lg:left-8 bottom-8 lg:bottom-auto whitespace-nowrap px-2 py-1 bg-black/90 backdrop-blur-md border border-white/20 text-[10px] uppercase font-mono tracking-widest rounded shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none ${isActive ? 'text-secondary-fixed opacity-100 border-secondary-fixed/50' : 'text-white'}`}>
                    {key.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PANEL DE DETALLES */}
        <div className="col-span-1 lg:col-span-8 flex flex-col items-start justify-center p-3 md:p-5 lg:p-8 flex-1 w-full gap-3 relative bg-gradient-to-l from-[#050505] to-[#0a0a0a] border-t lg:border-t-0 lg:border-l border-white/5 overflow-y-auto lg:overflow-hidden">

          <div className="mb-3 w-full">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <h3 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">{BOTANICAL_ATLAS[activeRegion]?.province}</h3>
              <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-fixed text-xl">location_on</span>
                <span className="font-label text-lg md:text-2xl uppercase tracking-wider font-semibold text-white">{BOTANICAL_ATLAS[activeRegion]?.name}</span>
              </div>
            </div>
          </div>

          {BOTANICAL_ATLAS[activeRegion]?.products?.length > 1 && (
            <div className="flex flex-col gap-1.5 mb-3 w-full">
              <div className="w-full flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] md:text-xs text-white/40 uppercase tracking-widest">{t('atlas_ui.multiple_strains')}</span>
                <span className="font-mono text-[10px] md:text-xs text-secondary-fixed uppercase tracking-widest font-bold bg-secondary-fixed/10 px-2 py-0.5 rounded">{t('atlas_ui.variety_prefix')}{productIndex + 1}{t('atlas_ui.variety_middle')}{BOTANICAL_ATLAS[activeRegion].products.length}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {BOTANICAL_ATLAS[activeRegion].products.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setProductIndex(idx)}
                    className={`px-3 py-1 rounded-full font-mono text-xs md:text-sm font-bold transition-all border ${idx === productIndex ? 'bg-secondary-fixed text-black border-secondary-fixed' : 'bg-transparent text-white/40 border-white/10 hover:border-white/30 hover:text-white'}`}
                  >
                    {p.variedad}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(() => {
            const currentProduct = BOTANICAL_ATLAS[activeRegion]?.products?.[productIndex];
            if (!currentProduct) return null;
            return (
              <div className="w-full">
                <div className="bg-black/40 border border-white/5 rounded-3xl p-8 md:p-12 w-full flex flex-col justify-center gap-6 shadow-xl relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1 h-full bg-secondary-fixed shadow-[0_0_8px_rgba(253,195,77,0.4)]"></div>
                  <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none"></div>

                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/5 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                      <span className="material-symbols-outlined text-sm">psychiatry</span>
                    </div>
                    <h4 className="font-bold text-white text-sm md:text-base">{currentProduct.variedad}</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10 mb-3">
                    <div className="space-y-1">
                      <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest mb-1 text-emerald-400">
                        <span className="w-1 h-1 bg-emerald-400 rounded-full"></span>
                        {t('atlas_ui.genetic_origin')}
                      </span>
                      <p className="font-light text-white/90 text-xs md:text-sm leading-relaxed">{currentProduct.genetica}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest mb-1 text-white/40">
                        <span className="w-1 h-1 bg-white/40 rounded-full"></span>
                        {t('atlas_ui.crop_notes')}
                      </span>
                      <p className="font-light text-white/95 text-sm md:text-base leading-relaxed">{currentProduct.cultivo}</p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 relative z-10">
                    <span className="flex items-center gap-2 font-mono text-xs md:text-sm uppercase tracking-widest mb-1.5 text-secondary-fixed">
                      <span className="w-1 h-1 bg-secondary-fixed rounded-full shadow-[0_0_10px_rgba(253,195,77,0.8)] animate-pulse"></span>
                      {t('atlas_ui.sensory_profile')}
                    </span>
                    <p className="font-light text-white/90 text-xs md:text-sm italic leading-snug">"{currentProduct.sensorial}"</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="w-full flex justify-center py-3 relative z-20">
        <button className="flex items-center gap-3 bg-transparent border border-secondary-fixed text-secondary-fixed px-8 py-2.5 rounded-full font-label text-sm font-bold uppercase tracking-[0.2em] hover:bg-secondary-fixed hover:text-black transition-all group focus:outline-none">
          <span className="material-symbols-outlined text-base">download</span>
          {t('atlas_ui.download_catalog')}
        </button>
      </div>
    </section>
  );
};

export default AtlasSection;
