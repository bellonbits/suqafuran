import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../utils/cn';

interface Props {
  variant?: 'pill' | 'list';
  className?: string;
  showLabels?: boolean;
}

const LanguageSwitcher: React.FC<Props> = ({ 
  variant = 'pill', 
  className,
  showLabels = false 
}) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const languages = [
    { code: 'so', label: 'Af-Soomaali', short: 'SO', color: '#4189DD' },
    { code: 'en', label: 'English', short: 'EN', color: '#CF101A' }
  ];

  const toggleLanguage = (lang: string) => {
    if (currentLang === lang.code) return;
    i18n.changeLanguage(lang);
    localStorage.setItem('suqafuran_lang', lang);
  };

  if (variant === 'list') {
    return (
      <div className={cn("space-y-2", className)}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => toggleLanguage(lang.code)}
            className={cn(
              "w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all active:scale-[0.98]",
              currentLang === lang.code 
                ? "border-primary-500 bg-primary-50 text-primary-900 shadow-sm" 
                : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
            )}
          >
            <div className="flex items-center gap-3">
              <div 
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-black text-[11px] text-white shadow-sm transition-transform",
                  currentLang === lang.code ? "scale-110" : "opacity-60"
                )}
                style={{ background: lang.color }}
              >
                {lang.short}
              </div>
              <span className={cn(
                "font-extrabold text-sm tracking-tight",
                currentLang === lang.code ? "text-gray-900" : "text-gray-500"
              )}>
                {lang.label}
              </span>
            </div>
            {currentLang === lang.code && (
              <div className="w-2.5 h-2.5 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(14,165,233,0.6)]" />
            )}
          </button>
        ))}
      </div>
    );
  }

  // Default 'pill' variant (used in headers)
  return (
    <div className={cn(
      "inline-flex items-center bg-white/15 backdrop-blur-md rounded-full p-1 border border-white/20 shadow-lg",
      className
    )}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => toggleLanguage(lang.code)}
          className={cn(
            "relative px-4 py-2 rounded-full text-[10px] font-black transition-all flex items-center gap-2 uppercase tracking-widest",
            currentLang === lang.code 
              ? "bg-white text-primary-600 shadow-md scale-105 z-10" 
              : "text-white/80 hover:text-white"
          )}
        >
          <div 
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-transform",
              currentLang === lang.code ? "scale-125" : "opacity-50"
            )} 
            style={{ background: lang.color }} 
          />
          {showLabels ? lang.label : lang.short}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
