import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const BADGES = [
  { icon: 'check_circle',   label: 'Registro Magap',  color: 'text-secondary-fixed', border: 'border-secondary-fixed/20' },
  { icon: 'verified_user',  label: 'Fitosanitario',   color: 'text-emerald-400',     border: 'border-emerald-500/40'    },
  { icon: 'account_balance',label: 'Aduana BCE',       color: 'text-secondary-fixed', border: 'border-secondary-fixed/20' },
];

const STATS = [
  { value: '+47',   label: 'Fincas Registradas' },
  { value: '5,300', label: 'Años de Herencia'    },
  { value: '100%',  label: 'Trazabilidad EUDR'   },
];

const LegitimacySection = () => {
  const { t } = useTranslation();

  return (
    <section className="snap-section bg-[#0a0700] text-white relative overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 opacity-[0.03] mix-blend-screen" style={{ backgroundImage: "url('/world_map.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-12 relative z-10 w-full pt-[calc(72px+1.5rem)]"
      >
        <div className="relative bg-black/60 backdrop-blur-md border border-secondary-fixed/30 rounded-2xl p-6 md:p-10 lg:p-12 overflow-hidden">
          <span className="absolute -right-16 -top-16 material-symbols-outlined text-[16rem] text-secondary-fixed/5 -rotate-12 pointer-events-none">verified</span>
          <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-secondary-fixed/80 via-emerald-500/80 to-secondary-fixed/80"></div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8">
              <motion.h2
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-surface-bright tracking-tight mb-4"
              >
                {t('legitimacy.title')}
              </motion.h2>
              <p className="font-body text-sm md:text-base text-white/70 max-w-xl leading-relaxed mb-6 font-light">{t('legitimacy.desc')}</p>

              <div className="flex flex-wrap gap-3">
                {BADGES.map(b => (
                  <div key={b.label} className={`flex items-center gap-2 bg-black/40 px-3 py-2 border ${b.border} rounded-lg`}>
                    <span className={`material-symbols-outlined ${b.color} text-base`}>{b.icon}</span>
                    <span className={`text-xs md:text-sm font-bold font-label uppercase tracking-wider ${b.color}`}>{b.label}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
                {STATS.map(stat => (
                  <div key={stat.label} className="text-center">
                    <div className="font-headline text-xl md:text-2xl lg:text-3xl font-bold text-secondary-fixed mb-1">{stat.value}</div>
                    <div className="font-label text-[10px] md:text-xs uppercase tracking-[0.15em] text-white/50">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden md:flex md:col-span-4 justify-end">
              <div className="relative w-32 h-32 lg:w-44 lg:h-44 rounded-full border border-dashed border-secondary-fixed/60 flex items-center justify-center p-2">
                <div className="w-full h-full rounded-full border-2 border-secondary-fixed flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1100] to-emerald-900/30 relative">
                  <svg className="absolute inset-0 w-full h-full p-2 origin-center animate-[spin_20s_linear_infinite] opacity-60" viewBox="0 0 100 100">
                    <path id="circlePath" d="M 50, 50 m -36, 0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" fill="none" />
                    <text className="font-label" style={{ fontSize: '11px', fill: '#fdc34d' }}>
                      <textPath href="#circlePath" startOffset="0%">• Certificado de Origen • Exportación Autorizada</textPath>
                    </text>
                  </svg>
                  <span className="material-symbols-outlined text-3xl md:text-4xl text-secondary-fixed mb-1 relative z-10">workspace_premium</span>
                  <span className="font-headline font-bold text-base md:text-xl text-white relative z-10">100%</span>
                  <span className="font-label text-[10px] uppercase tracking-[0.3em] text-secondary-fixed relative z-10">Auditado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default LegitimacySection;
