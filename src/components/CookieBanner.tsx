import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';

const STORAGE_KEY = 'suqafuran-cookie-consent';

export const CookieBanner: React.FC = () => {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            setVisible(true);
        }
    }, []);

    const accept = () => {
        localStorage.setItem(STORAGE_KEY, 'accepted');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-xl md:flex md:items-center md:justify-between md:gap-6">
            <div className="flex items-start gap-3 mb-3 md:mb-0">
                <Cookie className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">
                    {t('cookie.message')}{' '}
                    <Link to="/privacy-policy" className="text-primary-600 underline hover:text-primary-700 font-medium">
                        {t('cookie.learnMore')}
                    </Link>
                </p>
            </div>
            <button
                onClick={accept}
                className="w-full md:w-auto shrink-0 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
                {t('cookie.accept')}
            </button>
        </div>
    );
};
