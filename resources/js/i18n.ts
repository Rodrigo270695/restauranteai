import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

// Siempre iniciamos con 'es' para que el primer render (hidratación) sea consistente.
// El idioma guardado se aplica en useLanguageSync() después del montaje.
i18n.use(initReactI18next).init({
    resources: {
        es: { translation: es },
        en: { translation: en },
    },
    lng: 'es',
    fallbackLng: 'es',
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
