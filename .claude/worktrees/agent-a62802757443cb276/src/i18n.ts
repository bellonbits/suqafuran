import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import so from './locales/so.json'; 

const savedLang = localStorage.getItem('suqafuran_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      so: { translation: so },
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

/**
 * Loads content overrides from the backend and merges them into i18n resources
 */
export const loadOverrides = async () => {
  try {
    // We use a dynamic import for contentService to avoid circular dependencies if any
    const { contentService } = await import('./services/contentService');
    const overrides = await contentService.getContentOverrides();
    
    if (overrides.en) {
      i18n.addResourceBundle('en', 'translation', overrides.en, true, true);
    }
    if (overrides.so) {
      i18n.addResourceBundle('so', 'translation', overrides.so, true, true);
    }
    console.log('Site content overrides loaded successfully');
  } catch (error) {
    console.error('Failed to load site content overrides:', error);
  }
};

export default i18n;
