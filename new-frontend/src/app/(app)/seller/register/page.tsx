"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sellerService } from '@/services/sellerService';
import { motion } from 'framer-motion';
import { ChevronRight, MapPin, AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function SellerRegistrationPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        shop_name: '',
        owner_name: '',
        email: '',
        phone: '',
        mpesa_number: '',
        shop_address: '',
        category: 'groceries',
    });

    // Get current location
    useEffect(() => {
        if (typeof window !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error('Error getting location:', error);
                    // Default to Nairobi
                    setLocation({
                        latitude: -1.2921,
                        longitude: 36.8219,
                    });
                }
            );
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleVerifyMPesa = async () => {
        setError('');
        setLoading(true);
        try {
            const result = await sellerService.verifyMPesaNumber(formData.mpesa_number);
            if (result.verified) {
                setStep(3);
            } else {
                setError('M-Pesa verification failed. Please check your number.');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to verify M-Pesa number.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        setError('');
        if (!location) {
            setError('Location is required. Please enable location services.');
            return;
        }

        setLoading(true);
        try {
            const result = await sellerService.registerSeller({
                ...formData,
                location,
            });

            if (result.id) {
                // Redirect to seller dashboard
                router.push('/seller-dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-slate-900 dark:to-slate-950 py-12">
            <div className="max-w-2xl mx-auto px-4">
                {/* Progress */}
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Become a Seller</h1>
                    <p className="text-gray-600 dark:text-gray-400">Step {step} of 3</p>
                    <div className="w-full h-2 bg-gray-200 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(step / 3) * 100}%` }}
                            className="h-full bg-[#5bc0e8]"
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg flex gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                {/* Step 1: Shop Details */}
                {step === 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-8 space-y-6"
                    >
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Shop Details</h2>
                            <p className="text-gray-600 dark:text-gray-400">Tell us about your shop</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                                Shop Name *
                            </label>
                            <input
                                type="text"
                                name="shop_name"
                                value={formData.shop_name}
                                onChange={handleInputChange}
                                placeholder="e.g., Fresh Groceries Store"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-sky-600 outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                                Owner Name *
                            </label>
                            <input
                                type="text"
                                name="owner_name"
                                value={formData.owner_name}
                                onChange={handleInputChange}
                                placeholder="Your full name"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-sky-600 outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="your@email.com"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-sky-600 outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="+254 712 345 678"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-sky-600 outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                                Category *
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-sky-600 outline-none transition-colors"
                            >
                                <option value="groceries">Groceries</option>
                                <option value="general_goods">General Goods</option>
                                <option value="electronics">Electronics</option>
                                <option value="fashion">Fashion</option>
                                <option value="pharmacy">Pharmacy</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setStep(2)}
                            disabled={!formData.shop_name || !formData.owner_name || !formData.email || !formData.phone}
                            className="w-full bg-[#5bc0e8] hover:bg-sky-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                        >
                            Continue <ChevronRight className="w-5 h-5" />
                        </motion.button>
                    </motion.div>
                )}

                {/* Step 2: Location & Address */}
                {step === 2 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-8 space-y-6"
                    >
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Location Details</h2>
                            <p className="text-gray-600 dark:text-gray-400">Where is your shop located?</p>
                        </div>

                        {location && (
                            <div className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg flex gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-green-700 dark:text-green-300">Location detected</p>
                                    <p className="text-sm text-green-600 dark:text-green-400">Latitude: {location.latitude.toFixed(4)}, Longitude: {location.longitude.toFixed(4)}</p>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                                Shop Address *
                            </label>
                            <textarea
                                name="shop_address"
                                value={formData.shop_address}
                                onChange={(e) => setFormData({ ...formData, shop_address: e.target.value })}
                                placeholder="123 Main Street, Building A, Nairobi"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-sky-600 outline-none transition-colors"
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setStep(1)}
                                className="flex-1 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-900 dark:text-white font-bold py-3 rounded-lg transition-all"
                            >
                                Back
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setStep(3)}
                                disabled={!formData.shop_address}
                                className="flex-1 bg-[#5bc0e8] hover:bg-sky-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                            >
                                Continue <ChevronRight className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: M-Pesa Verification */}
                {step === 3 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-8 space-y-6"
                    >
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">M-Pesa Verification</h2>
                            <p className="text-gray-600 dark:text-gray-400">We need your M-Pesa number to pay you</p>
                        </div>

                        <div className="p-4 bg-[#e0f7ff] dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Your M-Pesa number is where we'll send your earnings. It must be registered in your name.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                                M-Pesa Number *
                            </label>
                            <input
                                type="tel"
                                name="mpesa_number"
                                value={formData.mpesa_number}
                                onChange={handleInputChange}
                                placeholder="+254 712 345 678"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-sky-600 outline-none transition-colors"
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleVerifyMPesa}
                            disabled={!formData.mpesa_number || loading}
                            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    Verify M-Pesa <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setStep(2)}
                            className="w-full bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-900 dark:text-white font-bold py-3 rounded-lg transition-all"
                        >
                            Back
                        </motion.button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
