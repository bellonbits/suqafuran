import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie } from 'lucide-react';
import { getConsent, setConsent } from '../utils/cookieConsent';

export const CookieBanner: React.FC = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (getConsent() === null) {
            const t = setTimeout(() => setVisible(true), 800);
            return () => clearTimeout(t);
        }
    }, []);

    const accept = () => {
        setConsent('accepted');
        setVisible(false);
    };

    const reject = () => {
        setConsent('rejected');
        // Clear any non-essential storage that may have been set before consent
        const keep = ['suqafuran-cookie-consent', 'suqafuran-onboarding-seen', 'i18nextLng'];
        Object.keys(localStorage)
            .filter(k => !keep.includes(k))
            .forEach(k => localStorage.removeItem(k));
        setVisible(false);
    };

    return (
        <AnimatePresence>
            {visible && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99998]"
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 60, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 60, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-sm w-full z-[99999] px-4 pb-6 sm:px-0 sm:pb-0"
                    >
                        <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100">
                            <div className="flex justify-center mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center">
                                    <Cookie className="w-8 h-8 text-primary-500" />
                                </div>
                            </div>

                            <h3 className="text-base font-bold text-gray-900 text-center mb-2">
                                We use cookies
                            </h3>
                            <p className="text-sm text-gray-500 text-center leading-relaxed mb-5">
                                We use essential cookies to keep the site working. If you decline, no tracking or analytics cookies will be stored.{' '}
                                <Link
                                    to="/privacy"
                                    onClick={() => setVisible(false)}
                                    className="text-primary-600 font-semibold underline-offset-2 underline"
                                >
                                    Privacy Policy
                                </Link>
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={reject}
                                    className="flex-1 border border-gray-200 text-gray-600 font-bold py-3.5 rounded-2xl transition-colors text-sm hover:bg-gray-50 active:bg-gray-100"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={accept}
                                    className="flex-1 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm"
                                >
                                    Accept
                                </button>
                            </div>

                            <p className="text-[10px] text-gray-400 text-center mt-3 leading-relaxed">
                                Rejecting only blocks non-essential cookies. The site still works fully.
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
