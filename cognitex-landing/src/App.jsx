import React, { useState, Suspense, lazy } from 'react';
import { translations } from './utils/translations';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import InteractiveEcosystem from './components/InteractiveEcosystem';
import Services from './components/Services';
import Platforms from './components/Platforms';
import Footer from './components/Footer';
import ContactModal from './components/ContactModal';

// Lazy Load Heavy Components
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

      <main>
        <Hero
          t={t.hero}
          setIsContactModalOpen={setIsContactModalOpen}
        />

        <About t={t.about} />

        <InteractiveEcosystem translations={t.ecosystem} />

        <Suspense fallback={<LoadingFallback />}>
        </Suspense>

        <Services t={t.services} />

        <Suspense fallback={<LoadingFallback />}>
          <CEOProfile translations={t.leadership} />
        </Suspense>

        <Platforms t={t.platforms} />
      </main>

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
