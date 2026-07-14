"use client";

import React from 'react';
import { useLanguageStore, type Language } from '../../store/useLanguage';

const LANGUAGES: { code: Language; short: string; dot: string }[] = [
    { code: 'en', short: 'EN', dot: '#CF101A' },
    { code: 'so', short: 'SO', dot: '#4189DD' },
];

export const LanguageToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { language, setLanguage } = useLanguageStore();

    return (
        <div className={`inline-flex items-center rounded-full p-0.5 bg-slate-100 dark:bg-slate-800 shrink-0 ${className}`}>
            {LANGUAGES.map((lang) => (
                <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code)}
                    className={`relative px-2.5 py-1 rounded-full text-[10px] font-black transition-all flex items-center gap-1.5 uppercase tracking-wider cursor-pointer ${
                        language === lang.code
                            ? 'bg-white text-primary shadow-sm dark:bg-slate-900 dark:text-sky-400'
                            : 'text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                >
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: lang.dot }} />
                    {lang.short}
                </button>
            ))}
        </div>
    );
};
