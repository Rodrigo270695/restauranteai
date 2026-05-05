import { useEffect } from 'react';
import i18n from '@/i18n';

/**
 * Sincroniza el idioma guardado en localStorage con i18next
 * después del primer montaje, evitando errores de hidratación.
 */
export function useLanguageSync() {
    useEffect(() => {
        const saved = localStorage.getItem('lang');
        if (saved && saved !== i18n.language) {
            i18n.changeLanguage(saved);
        }
    }, []);
}
