import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-black/95 backdrop-blur-md shadow-2xl border-b border-white/5 py-2' : 'bg-transparent py-3'}`}>
      <nav className="flex justify-between items-center px-6 md:px-12 max-w-screen-2xl mx-auto w-full">
        <a href="#" className={`transition-all duration-300 ${isScrolled ? 'opacity-100' : 'drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]'}`}>
          <img src="/logo.png" alt="Terra Latitude Corporate Logo" className="h-[3.5rem] md:h-[4.5rem] py-1 w-auto object-contain" />
        </a>
        <div className="hidden md:flex space-x-12 items-center">
          <a className={`font-headline text-xl tracking-tight transition-colors ${isScrolled ? 'text-secondary-fixed hover:text-white' : 'text-white/90 hover:text-white drop-shadow-sm'}`} href="#heritage">{t('nav.origin')}</a>
          <a className={`font-headline text-xl tracking-tight transition-colors ${isScrolled ? 'text-secondary-fixed hover:text-white' : 'text-white/90 hover:text-white drop-shadow-sm'}`} href="#products">{t('nav.products')}</a>
          <a className={`font-headline text-xl tracking-tight transition-colors ${isScrolled ? 'text-secondary-fixed hover:text-white' : 'text-white/90 hover:text-white drop-shadow-sm'}`} href="#sustainability">{t('nav.sustainability')}</a>
          <a className={`font-headline text-xl tracking-tight transition-colors ${isScrolled ? 'text-secondary-fixed hover:text-white' : 'text-white/90 hover:text-white drop-shadow-sm'}`} href="#contact">{t('nav.contact')}</a>
        </div>
        <div className={`flex items-center gap-2 font-headline font-bold transition-colors ${isScrolled ? 'text-white' : 'text-white drop-shadow-md'}`}>
          <span className="material-symbols-outlined text-2xl">language</span>
          <select 
            className="bg-transparent border-none outline-none cursor-pointer text-base font-bold tracking-widest text-inherit"
            onChange={changeLanguage}
            value={i18n.language}
          >
            <option value="es" className="bg-[#0a0a0a] text-secondary-fixed">ESPAÑOL</option>
            <option value="ru" className="bg-[#0a0a0a] text-secondary-fixed">РУССКИЙ</option>
            <option value="en" className="bg-[#0a0a0a] text-secondary-fixed">ENGLISH</option>
          </select>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
