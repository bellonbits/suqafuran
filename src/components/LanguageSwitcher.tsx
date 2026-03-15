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
