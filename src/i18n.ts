import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';

const savedLang = localStorage.getItem('suqafuran_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

// Lazy-load Somali only when needed — not on initial bundle
if (savedLang === 'so') {
  import('./locales/so.json').then((so) => {
    i18n.addResourceBundle('so', 'translation', so.default, true, true);
    i18n.changeLanguage('so');
  });
}

export async function loadSomali() {
  if (i18n.hasResourceBundle('so', 'translation')) return;
  const so = await import('./locales/so.json');
  i18n.addResourceBundle('so', 'translation', so.default, true, true);
}

export default i18n;
