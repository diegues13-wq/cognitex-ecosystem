import React from 'react';
import Hero from './components/Hero';
import Calculator from './components/Calculator';
import SocialLinks from './components/SocialLinks';
import { ArrowLeftRight } from 'lucide-react';

function App() {
  return (
    <div className="font-sans">
      {/* Background Decorators */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 sm:p-12">
        <header className="w-full max-w-4xl flex items-center justify-center mb-8 sm:mb-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-amber-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <ArrowLeftRight className="text-slate-950 w-7 h-7" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-amber-500 tracking-tight uppercase">
              Cash-Sentinel
            </h1>
          </div>
        </header>

        <main className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center flex-1">
          <div className="flex flex-col gap-8">
            <Hero />
            <SocialLinks />
          </div>
          <div className="flex justify-center w-full">
            <Calculator />
          </div>
        </main>

        <footer className="mt-20 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Cash-Sentinel. Powered by <a href="https://cognitexindustrial.com" className="text-emerald-500 hover:underline" target="_blank" rel="noopener noreferrer">Cognitex Industrial</a>.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
