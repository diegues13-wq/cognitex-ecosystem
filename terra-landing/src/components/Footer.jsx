import React from 'react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#050505] text-white/50 border-t border-white/5 font-body text-sm uppercase tracking-widest relative overflow-hidden">
      <div className="absolute inset-0 technical-overlay opacity-10 pointer-events-none"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-12 py-20 w-full max-w-screen-2xl mx-auto relative z-10">
        <div className="col-span-1">
          <div className="font-headline text-xl text-white mb-6">Terra Latitude</div>
          <p className="normal-case tracking-normal opacity-60 mb-6">{t('footer.slogan')}</p>
        </div>
        <div>
          <h5 className="font-bold mb-6 text-white/80">{t('footer.products')}</h5>
          <ul className="space-y-4">
            <li><a className="text-white/60 hover:text-secondary-fixed transition-all hover:translate-x-1 inline-block" href="#">Café Arábica</a></li>
            <li><a className="text-white/60 hover:text-secondary-fixed transition-all hover:translate-x-1 inline-block" href="#">Café Robusta</a></li>
            <li><a className="text-white/60 hover:text-secondary-fixed transition-all hover:translate-x-1 inline-block" href="#">Cacao Fino</a></li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold mb-6 text-white/80">{t('footer.legal')}</h5>
          <ul className="space-y-4">
            <li><a className="text-white/60 hover:text-secondary-fixed transition-all hover:translate-x-1 inline-block" href="#">Privacy</a></li>
            <li><a className="text-white/60 hover:text-secondary-fixed transition-all hover:translate-x-1 inline-block" href="#">Export Certs</a></li>
            <li><a className="text-white/60 hover:text-secondary-fixed transition-all hover:translate-x-1 inline-block" href="#">Partners</a></li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold mb-6 text-white/80">{t('footer.hq')}</h5>
          <p className="normal-case tracking-normal opacity-60 whitespace-pre-line">
            {t('footer.hq_address').replace('|', '\n')}
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-8 px-12 text-center text-[10px] opacity-40">
        {t('footer.copyright')}
      </div>
    </footer>
  );
};

export default Footer;
