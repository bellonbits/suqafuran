import { useTranslation } from 'react-i18next';

/**
 * A utility hook to select the correct language field from a bilingual object.
 * Maps 'en' -> field_en and 'so' -> field_so.
 * Falls back to 'en' if 'so' is missing.
 */
export function useLanguageField() {
    const { i18n } = useTranslation();
    const currentLang = i18n.language; // 'en' or 'so'

    const getField = <T extends Record<string, any>>(obj: T, fieldBase: string): string => {
        if (!obj) return '';

        const fieldEn = `${fieldBase}_en`;
        const fieldSo = `${fieldBase}_so`;

        // If current is Somali, try Somali first, then fallback to English
        if (currentLang === 'so') {
            return obj[fieldSo] || obj[fieldEn] || '';
        }

        // Default is English
        return obj[fieldEn] || '';
    };

    return { getField, currentLang };
}
