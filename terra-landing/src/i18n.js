import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import esTranslation from './locales/es.json';
import ruTranslation from './locales/ru.json';
import enTranslation from './locales/en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: esTranslation },
      ru: { translation: ruTranslation },
      en: { translation: enTranslation }
    },
    lng: "es", // Idioma en desarrollo activo
    fallbackLng: "es", // Fallback estricto a Español
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
