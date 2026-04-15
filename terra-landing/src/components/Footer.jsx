import { useTranslation } from 'react-i18next';

const PRODUCTS = [
  { key: 'footer_prod_arabica',  color: 'secondary-fixed' },
  { key: 'footer_prod_robusta',  color: 'secondary-fixed' },
  { key: 'footer_prod_cacao',    color: 'emerald-400'     },
];

const LEGAL_LINKS = [
  { key: 'footer_legal_privacy',  color: 'white'           },
  { key: 'footer_legal_terms',    color: 'white'           },
  { key: 'footer_legal_eudr',     color: 'emerald-400'     },
  { key: 'footer_legal_magap',    color: 'secondary-fixed' },
];

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="snap-section bg-[#050505] text-white/60 border-t border-white/5 font-body text-sm relative overflow-hidden justify-start">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-6 md:px-12 py-16 md:py-24 w-full max-w-screen-2xl mx-auto relative z-10">

        {/* Identidad Corporativa */}
        <div className="col-span-1 md:col-span-1 flex flex-col items-start">
          <div className="font-headline font-bold text-2xl text-white mb-2 tracking-tight">Terra <span className="text-secondary-fixed italic font-light">Latitude</span></div>
          <span className="w-12 h-1 bg-secondary-fixed mb-6"></span>
          <p className="font-light text-white/50 mb-6 leading-relaxed">
            Ecuador Premium Botanicals.<br />
            {t('footer.slogan')}
          </p>
          <div className="flex items-center gap-4">
            <a
              href="mailto:export@terralatitude.com"
              aria-label="Email"
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-secondary-fixed hover:text-black hover:border-secondary-fixed transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
            </a>
            <a
              href="https://wa.me/593999999999"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">sms</span>
            </a>
          </div>
        </div>

        {/* Productos */}
        <div>
          <h5 className="font-label font-bold tracking-[0.2em] uppercase text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary-fixed text-sm">inventory_2</span>
            {t('footer.products')}
          </h5>
          <ul className="space-y-4 font-light">
            {PRODUCTS.map(({ key, color }) => (
              <li key={key}>
                <a className={`hover:text-${color} hover:translate-x-1 transition-transform inline-flex items-center gap-2`} href="#products">
                  <span className={`w-1 h-1 bg-${color} rounded-full opacity-50`}></span>
                  {t(key)}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal & Cumplimiento */}
        <div>
          <h5 className="font-label font-bold tracking-[0.2em] uppercase text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary-fixed text-sm">policy</span>
            {t('footer.legal')}
          </h5>
          <ul className="space-y-4 font-light text-sm">
            {LEGAL_LINKS.map(({ key, color }) => (
              <li key={key}>
                <a className={`hover:text-${color} transition-colors`} href="#">{t(key)}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* HeadQuarters */}
        <div>
          <h5 className="font-label font-bold tracking-[0.2em] uppercase text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary-fixed text-sm">location_city</span>
            {t('footer.hq')}
          </h5>
          <p className="font-light text-white/50 whitespace-pre-line mb-6 leading-relaxed">
            {t('footer.hq_address').replace('|', '\n')}
          </p>
          <a href="mailto:export@terralatitude.com" className="font-bold text-secondary-fixed hover:text-white transition-colors">export@terralatitude.com</a>
        </div>
      </div>

      <div className="border-t border-white/5 bg-[#030303] py-6 text-center text-xs font-mono opacity-50 tracking-widest uppercase">
        {t('footer.copyright')}
      </div>
    </footer>
  );
};

export default Footer;
