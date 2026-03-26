import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

// Session-level cache: lang:text -> translated
const _cache = new Map<string, string>();

function cacheKey(text: string, lang: string) {
  return `${lang}:${text}`;
}

/**
 * Translates an array of strings when Somali is active.
 * Returns the original strings when English is active (instant).
 */
export function useTranslateContent(texts: string[]): string[] {
  const { i18n } = useTranslation();
  const isSomali = i18n.language === 'so';
  const [translated, setTranslated] = useState<string[]>(texts);
  const prevKey = useRef('');

  useEffect(() => {
    const key = `${i18n.language}:${texts.join('||')}`;
    if (key === prevKey.current) return;
    prevKey.current = key;

    if (!isSomali) {
      setTranslated(texts);
      return;
    }

    // Check cache first
    const cached = texts.map(t => _cache.get(cacheKey(t, 'so')) ?? '');
    if (cached.every(v => v !== '')) {
      setTranslated(cached);
      return;
    }

    // Fetch missing translations
    const uncachedIdxs = texts.reduce<number[]>((acc, t, i) => {
      if (!_cache.has(cacheKey(t, 'so'))) acc.push(i);
      return acc;
    }, []);

    const uncachedTexts = uncachedIdxs.map(i => texts[i]);

    api.post<{ translations: string[] }>('/translate', {
      texts: uncachedTexts,
      target: 'so',
    }).then(res => {
      const result = texts.map(t => _cache.get(cacheKey(t, 'so')) ?? t);
      res.data.translations.forEach((tr, n) => {
        const idx = uncachedIdxs[n];
        _cache.set(cacheKey(texts[idx], 'so'), tr || texts[idx]);
        result[idx] = tr || texts[idx];
      });
      setTranslated([...result]);
    }).catch(() => {
      setTranslated(texts); // fallback to original on error
    });
  }, [i18n.language, texts.join('||')]);

  return isSomali ? translated : texts;
}

/**
 * Translates a single string when Somali is active.
 */
export function useTranslateSingle(text: string): string {
  const results = useTranslateContent([text]);
  return results[0] ?? text;
}
