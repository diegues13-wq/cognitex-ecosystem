import React, { useState } from 'react';
import Hero from './components/Hero';
import Calculator from './components/Calculator';
import SocialLinks from './components/SocialLinks';
import { ShieldCheck } from 'lucide-react';
import { translations } from './translations';

function App() {
  const [lang, setLang] = useState('es');

  const t = (key, params) => {
    let text = translations[lang][key] || key;
    if (params) {
      Object.keys(params).forEach(p => {
        text = text.replace(`{${p}}`, params[p]);
      });
    }
    return text;
  };

  return (
    <div className="font-sans min-h-screen flex flex-col relative w-full overflow-x-hidden text-slate-900 bg-slate-50">

      {/* Top Banner */}
      <div className="w-full bg-slate-950 text-white text-xs py-2 px-4 flex justify-center items-center gap-2 font-medium">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>{t('bannerText')}</span>
      </div>

      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 flex items-center justify-center rounded-xl shadow-md shadow-blue-600/20">
              <span className="font-black text-xl text-white tracking-tighter">CS</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              CASH-SENTINEL
            </h1>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 text-sm font-semibold">
            <a href="#como-funciona" className="hidden md:block text-slate-600 hover:text-blue-600 transition-colors">{t('howItWorks')}</a>
            <a href="#soporte" className="hidden md:block text-slate-600 hover:text-blue-600 transition-colors">{t('support')}</a>

            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button onClick={() => setLang('es')} className={`px-2 py-1/2 rounded-md transition-all ${lang === 'es' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>ES</button>
              <button onClick={() => setLang('en')} className={`px-2 py-1/2 rounded-md transition-all ${lang === 'en' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>EN</button>
              <button onClick={() => setLang('ru')} className={`px-2 py-1/2 rounded-md transition-all ${lang === 'ru' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>RU</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full relative pb-20">
        {/* Dynamic Blue Background Accent */}
        <div className="absolute top-0 left-0 w-full h-[550px] bg-gradient-to-br from-blue-900 to-blue-700 z-0 hidden lg:block" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 0% 100%)' }}></div>
        <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-br from-blue-900 to-blue-700 z-0 lg:hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0% 100%)' }}></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 pt-10 lg:pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">

            {/* Left Column: Copy */}
            <div className="lg:col-span-7 flex flex-col gap-8 pt-4">
              <Hero t={t} />
            </div>

            {/* Right Column: Calculator */}
            <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
              <Calculator t={t} />
            </div>

          </div>

          <div className="mt-24 w-full">
            <SocialLinks t={t} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-950 text-slate-400 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-70">
            <span className="font-bold text-lg text-white">CASH-SENTINEL</span>
          </div>
          <div className="text-sm text-center md:text-right">
            <p>&copy; {new Date().getFullYear()} Cash-Sentinel. {t('rightsReserved')}</p>
            <p className="mt-1 text-xs">
              {t('poweredBy')} <a href="https://cognitexindustrial.com" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Cognitex Industrial</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
