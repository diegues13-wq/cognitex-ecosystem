import React from 'react';
import Hero from './components/Hero';
import Calculator from './components/Calculator';
import SocialLinks from './components/SocialLinks';
import { ShieldCheck } from 'lucide-react';

function App() {
  return (
    <div className="font-sans min-h-screen flex flex-col relative w-full overflow-x-hidden">

      {/* Top Banner (Optional Trust Signal) */}
      <div className="w-full bg-slate-900 text-white text-xs py-2 px-4 flex justify-center items-center gap-2 font-medium">
        <ShieldCheck className="w-4 h-4 text-yellow-400" />
        <span>Tus transferencias internacionales 100% seguras y protegidas.</span>
      </div>

      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-yellow-400 flex items-center justify-center rounded-lg shadow-sm">
              <span className="font-black text-xl text-slate-900 tracking-tighter">CS</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              CASH-SENTINEL
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#como-funciona" className="hover:text-yellow-600 transition-colors">¿Cómo funciona?</a>
            <a href="#soporte" className="hover:text-yellow-600 transition-colors">Soporte 24/7</a>
          </div>
        </div>
      </header>

      {/* Main Content Area (Yellow Background Split) */}
      <main className="flex-1 w-full bg-slate-50 relative pb-20">
        {/* Yellow Background Accent (Western Union style) */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-[#FFCC00] z-0 hidden lg:block" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60%, 0% 100%)' }}></div>
        <div className="absolute top-0 left-0 w-full h-[300px] bg-[#FFCC00] z-0 lg:hidden"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 pt-12 lg:pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">

            {/* Left Column: Copy & Trust (Hero) */}
            <div className="lg:col-span-7 flex flex-col gap-8 pt-4">
              <Hero />
            </div>

            {/* Right Column: The Calculator Tool */}
            <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
              <Calculator />
            </div>

          </div>

          {/* Bottom Section: Socials */}
          <div className="mt-24 w-full">
            <SocialLinks />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-900 text-slate-400 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 grayscale opacity-50">
            <span className="font-bold text-lg text-white">CASH-SENTINEL</span>
          </div>
          <div className="text-sm text-center md:text-right">
            <p>&copy; {new Date().getFullYear()} Cash-Sentinel. Todos los derechos reservados.</p>
            <p className="mt-1 text-xs">
              Powered by <a href="https://cognitexindustrial.com" className="text-yellow-400 hover:underline" target="_blank" rel="noopener noreferrer">Cognitex Industrial</a>
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
