import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const containerRef = useRef(null);
  const { scrollY } = useScroll({ container: containerRef });
  const [menuOpen, setMenuOpen] = useState(false);

  // Attach ref to the snap-root container once mounted
  useEffect(() => {
    containerRef.current = document.getElementById('snap-root');
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  // Programmatic smooth scroll to section (works with snap containers)
  const scrollToSection = useCallback((e, href) => {
    e.preventDefault();
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMenuOpen(false);
  }, []);

  // Close menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Scroll-reactive styles
  const bgOpacity     = useTransform(scrollY, [0, 80], [0, 0.96]);
  const blurAmount    = useTransform(scrollY, [0, 80], [0, 16]);
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 0.07]);
  const paddingY      = useTransform(scrollY, [0, 80], [12, 6]);
  const logoOpacity   = useTransform(scrollY, [0, 80], [0.9, 1]);
  const logoScale     = useTransform(scrollY, [0, 80], [1, 0.92]);

  const navLinks = [
    { label: t('nav.origin'),        href: '#heritage'      },
    { label: t('nav.products'),      href: '#products'      },
    { label: t('nav.sustainability'),href: '#sustainability' },
    { label: t('nav.contact'),       href: '#contact'       },
  ];

  return (
    <>
      <motion.header
        style={{ paddingTop: paddingY, paddingBottom: paddingY }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        {/* Background materializes on scroll */}
        <motion.div
          className="absolute inset-0 bg-black"
          style={{ opacity: menuOpen ? 0.98 : bgOpacity }}
        />
        {/* Bottom border */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px bg-white"
          style={{ opacity: borderOpacity }}
        />

        <nav className="relative flex justify-between items-center px-5 md:px-12 max-w-screen-2xl mx-auto w-full">
          
          {/* Logo */}
          <motion.a href="#" style={{ opacity: logoOpacity, scale: logoScale }}>
            <img
              src="/logo.png"
              alt="Terra Latitude Corporate Logo"
              className="h-[3rem] md:h-[4rem] py-1 w-auto object-contain"
            />
          </motion.a>

          {/* Desktop nav links */}
          <div className="hidden md:flex space-x-8 lg:space-x-12 items-center">
            {navLinks.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={(e) => scrollToSection(e, href)}
                className="font-headline text-base lg:text-lg tracking-tight text-white/90 hover:text-secondary-fixed transition-colors duration-300"
              >
                {label}
              </a>
            ))}

            {/* Language Selector — desktop */}
            <div className="relative flex items-center gap-1">
              <span className="material-symbols-outlined text-white/70 text-sm">language</span>
              <select
                className="bg-transparent text-white/90 font-headline text-sm uppercase tracking-wider focus:outline-none cursor-pointer hover:text-secondary-fixed transition-colors appearance-none pr-4"
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
              >
                <option value="es" className="bg-black text-white">{t('nav.lang_es')}</option>
                <option value="en" className="bg-black text-white">{t('nav.lang_en')}</option>
                <option value="ru" className="bg-black text-white">{t('nav.lang_ru')}</option>
              </select>
              <span className="material-symbols-outlined text-white/70 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-xs">expand_more</span>
            </div>
          </div>

          {/* Mobile: hamburger + lang selector row */}
          <div className="flex md:hidden items-center gap-3">
            {/* Compact language selector for mobile */}
            <select
              className="bg-transparent text-white/80 font-headline text-xs uppercase tracking-wider focus:outline-none cursor-pointer appearance-none border border-white/20 rounded px-2 py-1"
              value={i18n.language}
              onChange={(e) => changeLanguage(e.target.value)}
            >
              <option value="es" className="bg-black text-white">ES</option>
              <option value="en" className="bg-black text-white">EN</option>
              <option value="ru" className="bg-black text-white">RU</option>
            </select>

            {/* Hamburger button */}
            <button
              id="mobile-menu-btn"
              onClick={() => setMenuOpen(prev => !prev)}
              className="relative w-10 h-10 flex flex-col items-center justify-center gap-[5px] focus:outline-none group"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <span className={`block w-6 h-0.5 bg-white transition-all duration-300 origin-center ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
              <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`block w-6 h-0.5 bg-white transition-all duration-300 origin-center ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
            </button>
          </div>

        </nav>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-40 bg-black/97 backdrop-blur-xl flex flex-col items-center justify-center gap-10 md:hidden"
            style={{ paddingTop: '72px' }}
          >
            {/* Nav Links */}
            <nav className="flex flex-col items-center gap-8 w-full px-8">
              {navLinks.map(({ label, href }, i) => (
                <motion.a
                  key={href}
                  href={href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3 }}
                  onClick={(e) => scrollToSection(e, href)}
                  className="font-headline text-3xl font-bold text-white/90 hover:text-secondary-fixed transition-colors text-center border-b border-white/10 w-full pb-6 last:border-0"
                >
                  {label}
                </motion.a>
              ))}
            </nav>

            {/* Language selector in menu */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="flex items-center gap-3 border border-white/20 rounded-full px-6 py-3"
            >
              <span className="material-symbols-outlined text-white/50 text-base">language</span>
              {['es', 'en', 'ru'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => changeLanguage(lang)}
                  className={`font-headline text-sm uppercase tracking-widest px-3 py-1 rounded-full transition-all ${i18n.language === lang ? 'bg-secondary-fixed text-black font-bold' : 'text-white/60 hover:text-white'}`}
                >
                  {lang}
                </button>
              ))}
            </motion.div>

            {/* Decorative glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-secondary-fixed/10 rounded-full blur-[80px] pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
