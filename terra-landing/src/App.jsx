import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';

function App() {
  const { i18n } = useTranslation();

  // Sincroniza el atributo lang del HTML con el idioma activo
  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <>
      <Navbar />
      <div
        id="snap-root"
        className="snap-container bg-[#0a0700] text-white font-body"
      >
        <Landing />
        <Footer />
      </div>
    </>
  );
}

export default App;
