import React, { useState, Suspense, lazy } from 'react';
import { translations } from './utils/translations';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import Platforms from './components/Platforms';
import Footer from './components/Footer';
import ContactModal from './components/ContactModal';

// Lazy Load Heavy Components
const Industry40Section = lazy(() => import('./components/Industry40Section'));
const CEOProfile = lazy(() => import('./components/CEOProfile'));

const LoadingFallback = () => (
  <div className="py-20 flex justify-center items-center">
    <div className="w-8 h-8 border-4 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin"></div>
  </div>
);

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [language, setLanguage] = useState('es');

  const t = translations[language];

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'es' ? 'en' : 'es');
  };

  return (
    <div className="min-h-screen bg-industrial-950 text-industrial-100 font-sans selection:bg-neon-cyan/30 overflow-x-hidden relative">
      {/* GLOBAL BACKGROUND EFFECTS */}
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none z-0"></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-neon-cyan/5 blur-[120px] rounded-full pointer-events-none z-0 animate-pulse-slow"></div>

      <Navbar
        t={t.nav}
        language={language}
        toggleLanguage={toggleLanguage}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        setIsContactModalOpen={setIsContactModalOpen}
      />

      <Hero
        t={t.hero}
        setIsContactModalOpen={setIsContactModalOpen}
      />

      {/* ABOUT US - Kept inline as it's small/critical for above-the-fold continuity */}
      <section id="about" className="py-20 px-6 relative z-10 bg-black/40 border-y border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h3 className="text-sm font-mono text-neon-cyan mb-2 tracking-widest">{t.about.title}</h3>
            <h4 className="text-3xl font-black text-white mb-6">Ingeniería que Impulsa el Futuro</h4>
            <p className="text-gray-400 leading-relaxed mb-6">
              {t.about.description}
            </p>
            <div className="flex gap-4">
              <div className="bg-industrial-800 p-4 rounded-xl border border-white/5">
                {/* Icons inline to avoid creating another tiny component for this specific section */}
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neon-purple mb-2"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" /><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" /><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" /><path d="M17.599 6.5a3 3 0 0 0 .399-1.375" /><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" /><path d="M3.477 10.896a4 4 0 0 1 .585-.396" /><path d="M19.938 10.5a4 4 0 0 1 .585.396" /><path d="M6 18a4 4 0 0 1-1.97-1.375" /><path d="M17.97 16.625A4.002 4.002 0 0 1 18 18" /></svg>
                <span className="font-bold text-white text-sm block">{t.about.axis1}</span>
              </div>
              <div className="bg-industrial-800 p-4 rounded-xl border border-white/5">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neon-green mb-2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                <span className="font-bold text-white text-sm block">{t.about.axis2}</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-video bg-gradient-to-br from-industrial-800 to-black rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden group">
              <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-800 group-hover:text-neon-cyan/20 transition-colors duration-700"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
              <div className="absolute inset-0 bg-gradient-to-t from-industrial-950 to-transparent opacity-60"></div>
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={<LoadingFallback />}>
        <Industry40Section translations={t.industry40} />
      </Suspense>

      <Services t={t.services} />

      <Suspense fallback={<LoadingFallback />}>
        <CEOProfile translations={t.leadership} />
      </Suspense>

      <Platforms t={t.platforms} />

      <Footer />

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        t={t.contact}
      />
    </div>
  );
}

export default App;
