import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'suqafuran-cookie-consent';

export const CookieBanner: React.FC = () => {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            // Small delay so it appears after the app renders
            const t = setTimeout(() => setVisible(true), 800);
            return () => clearTimeout(t);
        }
    }, []);

    const accept = () => {
        localStorage.setItem(STORAGE_KEY, 'accepted');
        setVisible(false);
    };

    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99998]"
                    />

                    {/* Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 60, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 60, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-sm w-full z-[99999] px-4 pb-6 sm:px-0 sm:pb-0"
                    >
                        <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100">
                            {/* Icon */}
                            <div className="flex justify-center mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center">
                                    <ShieldCheck className="w-8 h-8 text-primary-500" />
                                </div>
                            </div>

                            {/* Text */}
                            <h3 className="text-base font-bold text-gray-900 text-center mb-2">
                                {t('cookie.title', 'We use cookies')}
                            </h3>
                            <p className="text-sm text-gray-500 text-center leading-relaxed mb-5">
                                {t('cookie.message')}{' '}
                                <Link
                                    to="/privacy"
                                    onClick={accept}
                                    className="text-primary-600 font-semibold underline-offset-2 underline"
                                >
                                    {t('cookie.learnMore')}
                                </Link>
                            </p>

                            {/* Buttons */}
                            <button
                                onClick={accept}
                                className="w-full bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm tracking-wide"
                            >
                                {t('cookie.accept')}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
