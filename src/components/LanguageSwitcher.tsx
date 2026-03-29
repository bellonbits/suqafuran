import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  compact?: boolean;
  light?: boolean;
}

const SO_BG = '#4189DD';
const EN_BG = '#CF101A';

const LanguageSwitcher: React.FC<Props> = ({ compact = false, light: _light = false }) => {
  const { i18n } = useTranslation();
  const isSomali = i18n.language === 'so';

  const switchTo = (lang: string) => {
    if (i18n.language === lang) return;
    i18n.changeLanguage(lang);
    localStorage.setItem('suqafuran_lang', lang);
  };

  const Pill = ({ small = false }: { small?: boolean }) => (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
        overflow: 'hidden',
        border: '1.5px solid rgba(0,0,0,0.15)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        flexShrink: 0,
      }}
    >
      <button
        onClick={() => switchTo('so')}
        title="Af-Soomaali"
        style={{
          background: SO_BG,
          color: 'white',
          fontWeight: 800,
          fontSize: small ? 10 : 11,
          letterSpacing: 0.5,
          padding: small ? '4px 8px' : '5px 10px',
          opacity: isSomali ? 1 : 0.4,
          border: 'none',
          cursor: 'pointer',
          lineHeight: 1,
          transition: 'opacity 0.2s',
        }}
      >
        SO
      </button>

      <span style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.5)' }} />

      <button
        onClick={() => switchTo('en')}
        title="English"
        style={{
          background: EN_BG,
          color: 'white',
          fontWeight: 800,
          fontSize: small ? 10 : 11,
          letterSpacing: 0.5,
          padding: small ? '4px 8px' : '5px 10px',
          opacity: isSomali ? 0.4 : 1,
          border: 'none',
          cursor: 'pointer',
          lineHeight: 1,
          transition: 'opacity 0.2s',
        }}
      >
        EN
      </button>
    </div>
  );

  if (compact) return <Pill small />;
  return <Pill />;
};

export default LanguageSwitcher;
