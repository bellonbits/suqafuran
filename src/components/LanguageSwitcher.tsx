import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  compact?: boolean;
  light?: boolean;
}

function applyGoogleTranslate(lang: string) {
  if (lang === 'en') {
    restoreOriginal();
    return;
  }

  // Translate to Somali — retry until GT widget is ready
  const attempt = (retries: number) => {
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (select) {
      select.value = 'so';
      select.dispatchEvent(new Event('change'));
    } else if (retries > 0) {
      setTimeout(() => attempt(retries - 1), 300);
    }
  };
  attempt(15);
}

function restoreOriginal() {
  // 1) Official GT API restore
  try {
    const gt = (window as any).google?.translate?.TranslateElement?.getInstance?.();
    if (gt?.restore) { gt.restore(); return; }
  } catch {}

  // 2) Click the "Show original" button inside the GT banner iframe
  try {
    const banner = document.querySelector('iframe.goog-te-banner-frame') as HTMLIFrameElement | null;
    if (banner) {
      const doc = banner.contentDocument ?? banner.contentWindow?.document;
      if (doc) {
        const buttons = doc.querySelectorAll('button');
        for (const btn of Array.from(buttons)) {
          if (btn.textContent?.toLowerCase().includes('original')) {
            btn.click();
            return;
          }
        }
        // Some GT versions use a div with id containing "restore"
        const divs = doc.querySelectorAll('div[id]');
        for (const div of Array.from(divs)) {
          if (div.id.toLowerCase().includes('restore')) {
            (div as HTMLElement).click();
            return;
          }
        }
      }
    }
  } catch {}

  // 3) Set select to current page language (not empty string — empty often no-ops)
  const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
  if (select) {
    // Pick the first option (usually the source/original language)
    const firstOption = select.options[0]?.value ?? 'en';
    select.value = firstOption;
    select.dispatchEvent(new Event('change'));
    return;
  }

  // 4) Last resort: clear googtrans cookie and reload
  document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
  window.location.reload();
}

/* Somali flag colours */
const SO_BG = '#4189DD';   // Somali blue
const EN_BG = '#CF101A';   // English red (UK/US)

const LanguageSwitcher: React.FC<Props> = ({ compact = false, light: _light = false }) => {
  const { i18n } = useTranslation();
  const isSomali = i18n.language === 'so';

  const toggle = () => {
    const next = isSomali ? 'en' : 'so';
    i18n.changeLanguage(next);
    localStorage.setItem('suqafuran_lang', next);
    applyGoogleTranslate(next);
  };

  /* ── shared pill toggle (used everywhere) ── */
  const Pill = ({ small = false }: { small?: boolean }) => (
    <button
      onClick={toggle}
      title={isSomali ? 'Switch to English' : 'Ku beddel Soomaali'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
        overflow: 'hidden',
        border: '1.5px solid rgba(255,255,255,0.35)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        cursor: 'pointer',
        padding: 0,
        background: 'none',
        gap: 0,
        flexShrink: 0,
      }}
    >
      {/* SO segment */}
      <span
        style={{
          background: SO_BG,
          color: 'white',
          fontWeight: 800,
          fontSize: small ? 10 : 11,
          letterSpacing: 0.5,
          padding: small ? '3px 7px' : '4px 9px',
          opacity: isSomali ? 1 : 0.45,
          transition: 'opacity 0.2s',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
        }}
      >
        {/* Somali star ★ */}
        <span style={{ fontSize: small ? 8 : 9, lineHeight: 1 }}>★</span>
        SO
      </span>

      {/* divider */}
      <span style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.4)' }} />

      {/* EN segment */}
      <span
        style={{
          background: EN_BG,
          color: 'white',
          fontWeight: 800,
          fontSize: small ? 10 : 11,
          letterSpacing: 0.5,
          padding: small ? '3px 7px' : '4px 9px',
          opacity: isSomali ? 0.45 : 1,
          transition: 'opacity 0.2s',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
        }}
      >
        {/* UK union-jack dots */}
        <span style={{ fontSize: small ? 8 : 9, lineHeight: 1 }}>🇬🇧</span>
        EN
      </span>
    </button>
  );

  if (compact) return <Pill small />;

  return <Pill />;
};

export default LanguageSwitcher;
