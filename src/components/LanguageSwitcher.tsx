import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  compact?: boolean;
  light?: boolean;
}

function applyGoogleTranslate(lang: string) {
  // Give the GT widget a moment to initialise on first use
  const attempt = (retries: number) => {
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (select) {
      select.value = lang === 'so' ? 'so' : '';
      select.dispatchEvent(new Event('change'));
    } else if (retries > 0) {
      setTimeout(() => attempt(retries - 1), 300);
    }
  };
  attempt(10);
}

const LanguageSwitcher: React.FC<Props> = ({ compact = false, light = false }) => {
  const { i18n } = useTranslation();
  const isSomali = i18n.language === 'so';

  const toggle = () => {
    const next = isSomali ? 'en' : 'so';
    i18n.changeLanguage(next);
    localStorage.setItem('suqafuran_lang', next);
    applyGoogleTranslate(next);
  };

  if (compact) {
    return (
      <button
        onClick={toggle}
        className={
          light
            ? 'flex items-center gap-1 px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-700 text-xs font-bold transition-colors hover:bg-gray-100'
            : 'flex items-center gap-1 px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors'
        }
        title={isSomali ? 'Switch to English' : 'Af-Soomaali'}
      >
        {isSomali ? 'EN' : 'SO'}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors shadow-sm"
    >
      <span>{isSomali ? 'English' : 'Somali'}</span>
    </button>
  );
};

export default LanguageSwitcher;
