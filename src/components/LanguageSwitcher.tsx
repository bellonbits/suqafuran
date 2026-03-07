import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  compact?: boolean;
}

const LanguageSwitcher: React.FC<Props> = ({ compact = false }) => {
  const { i18n } = useTranslation();
  const isSomali = i18n.language === 'so';

  const toggle = () => {
    const next = isSomali ? 'en' : 'so';
    i18n.changeLanguage(next);
    localStorage.setItem('suqafuran_lang', next);
  };

  if (compact) {
    return (
      <button
        onClick={toggle}
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors"
        title={isSomali ? 'Switch to English' : 'Af-Soomaali'}
      >
        {isSomali ? '🇬🇧 EN' : '🇸🇴 SO'}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors shadow-sm"
    >
      <span>{isSomali ? '🇬🇧' : '🇸🇴'}</span>
      <span>{isSomali ? 'English' : 'Somali'}</span>
    </button>
  );
};

export default LanguageSwitcher;
