import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  compact?: boolean;
  light?: boolean;
}

/* ── Read current Google Translate language from cookie ── */
function getGTLang(): string {
  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([^;]+)/);
  return match ? match[1] : 'en';
}

/* ── Set googtrans cookie on both path and domain, then reload ── */
function setGTLang(lang: string) {
  const value = lang === 'en' ? '/en/en' : `/en/${lang}`;
  const domain = window.location.hostname;
  // Set on root path and on the domain so it persists across all pages
  document.cookie = `googtrans=${value}; path=/`;
  document.cookie = `googtrans=${value}; path=/; domain=${domain}`;
  document.cookie = `googtrans=${value}; path=/; domain=.${domain}`;
  // Persist choice so the pill shows correctly after reload
  localStorage.setItem('suqafuran_lang', lang);
  window.location.reload();
}

const SO_BG = '#4189DD';
const EN_BG = '#CF101A';

const LanguageSwitcher: React.FC<Props> = ({ compact = false, light: _light = false }) => {
  const { i18n } = useTranslation();

  // Derive current language: cookie is ground truth after reload,
  // localStorage is used before first toggle so the pill renders correctly.
  const currentLang = getGTLang() !== 'en'
    ? getGTLang()
    : (localStorage.getItem('suqafuran_lang') || 'en');

  const isSomali = currentLang === 'so';

  const switchTo = (lang: string) => {
    if (lang === currentLang) return;
    i18n.changeLanguage(lang); // sync i18n too
    setGTLang(lang);
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
      {/* SO */}
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

      {/* divider */}
      <span style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.5)' }} />

      {/* EN */}
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
