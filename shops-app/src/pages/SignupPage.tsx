"use client";

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, User as UserIcon, Phone, Eye, EyeOff, Loader2, RotateCw } from 'lucide-react';
import { useAuthStore } from '@/store/useAuth';
import { authService } from '@/services/auth';
import { identifyUser, trackEvent } from '@/lib/analytics';

const COUNTRY_CODES = [
    { code: '+254', label: 'Kenya +254', flag: '🇰🇪' },
    { code: '+252', label: 'Somalia +252', flag: '🇸🇴' },
    { code: '+251', label: 'Ethiopia +251', flag: '🇪🇹' },
    { code: '+253', label: 'Djibouti +253', flag: '🇩🇯' },
];

export default function SignupPage() {
    const navigate = useNavigate();
    const { user, login: storeLogin } = useAuthStore();

    const [method, setMethod] = useState<'email' | 'phone'>('email');
    const [step, setStep] = useState<'form' | 'otp'>('form');

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [countryCode, setCountryCode] = useState('+254');
    const [localPhone, setLocalPhone] = useState('');
    const [otp, setOtp] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cooldown, setCooldown] = useState(0);

    const phone = `${countryCode}${localPhone.replace(/\D/g, '')}`;

    useEffect(() => {
        if (user) {
            navigate('/shops', { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const finishLogin = async (token: string) => {
        const me = await authService.getMe(token);
        storeLogin(me, token);
        identifyUser(me);
        trackEvent('Signup Completed', { method });
        navigate('/', { replace: true });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (step === 'form' && method === 'email') {
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                return;
            }
            if (password.length < 8) {
                setError('Password must be at least 8 characters');
                return;
            }
        }

        setLoading(true);

        try {
            if (method === 'email') {
                if (step === 'form') {
                    const ack = await authService.signupEmail({ full_name: fullName, email, password });
                    setCooldown(ack.cooldown_seconds || 60);
                    setStep('otp');
                } else {
                    const { access_token } = await authService.verifyEmailOtp(email, otp);
                    await finishLogin(access_token);
                }
            } else {
                if (step === 'form') {
                    const ack = await authService.signupPhone({ full_name: fullName, phone });
                    setCooldown(ack.cooldown_seconds || 60);
                    setStep('otp');
                } else {
                    const { access_token } = await authService.verifyPhoneOtp(phone, otp);
                    await finishLogin(access_token);
                }
            }
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Failed to create account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0) return;
        setError('');
        try {
            const ack = method === 'email'
                ? await authService.requestEmailOtp(email)
                : await authService.requestPhoneOtp(phone);
            setCooldown(ack.cooldown_seconds || 60);
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Failed to resend code');
        }
    };

    return (
        <div className="min-h-[calc(100dvh-4rem)] sm:min-h-[calc(100vh-8rem)] flex flex-col justify-start sm:justify-center sm:items-center px-4 sm:px-6 py-6 sm:py-12 bg-white dark:bg-black">
            <div className="w-full max-w-md mx-auto">
                {/* Back Button */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 flex items-center justify-center text-gray-700 dark:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors shadow-sm"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </div>

                {/* Header Title */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        Create Account
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 mt-1.5 font-medium">
                        Create your account for daily marketplace updates
                    </p>
                </div>

                {/* Method Switcher */}
                {step === 'form' && (
                    <div className="flex p-1 mb-6 rounded-2xl bg-slate-100 dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800">
                        <button
                            type="button"
                            onClick={() => { setMethod('email'); setError(''); }}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                                method === 'email'
                                    ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800'
                            }`}
                        >
                            Email
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMethod('phone'); setError(''); }}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                                method === 'phone'
                                    ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800'
                            }`}
                        >
                            Phone Number
                        </button>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="mb-5 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-bold">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {step === 'otp' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 dark:text-neutral-300 block mb-1">
                                    Verification Code
                                </label>
                                <p className="text-xs text-gray-500 dark:text-neutral-400 mb-2">
                                    We sent a 6-digit code to <span className="font-bold text-gray-800 dark:text-neutral-200">{method === 'email' ? email : phone}</span>
                                </p>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    inputMode="numeric"
                                    placeholder="6-digit code"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength={6}
                                    className="w-full rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-900/80 px-4 py-3.5 text-lg font-black tracking-[0.25em] text-center outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:focus:bg-neutral-950 text-gray-900 dark:text-white transition-all"
                                />
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1">
                                <span className="text-gray-500 dark:text-neutral-400">Didn't receive code?</span>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={cooldown > 0}
                                    className="font-bold text-orange-600 dark:text-orange-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                    {cooldown > 0 ? `Resend in ${cooldown}s` : <><RotateCw className="w-3 h-3" /> Resend</>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Full Name */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Mary Wanjiku"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-900/80 pl-11 pr-4 py-3.5 text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:focus:bg-neutral-950 text-gray-900 dark:text-white transition-all placeholder:text-gray-400"
                                    />
                                </div>
                            </div>

                            {/* Email or Phone */}
                            {method === 'email' ? (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            required
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-900/80 pl-11 pr-4 py-3.5 text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:focus:bg-neutral-950 text-gray-900 dark:text-white transition-all placeholder:text-gray-400"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                                        Phone Number
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            value={countryCode}
                                            onChange={(e) => setCountryCode(e.target.value)}
                                            className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-900/80 px-2.5 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-neutral-100"
                                        >
                                            {COUNTRY_CODES.map((c) => (
                                                <option key={c.code} value={c.code}>{c.label}</option>
                                            ))}
                                        </select>
                                        <div className="relative flex-1">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="tel"
                                                required
                                                placeholder="712345678"
                                                value={localPhone}
                                                onChange={(e) => setLocalPhone(e.target.value)}
                                                className="w-full rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-900/80 pl-11 pr-4 py-3.5 text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:focus:bg-neutral-950 text-gray-900 dark:text-white transition-all placeholder:text-gray-400"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Password */}
                            {method === 'email' && (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                minLength={8}
                                                placeholder="At least 8 characters"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-900/80 pl-11 pr-11 py-3.5 text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:focus:bg-neutral-950 text-gray-900 dark:text-white transition-all placeholder:text-gray-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((s) => !s)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200"
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                required
                                                placeholder="Re-enter your password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-900/80 pl-11 pr-11 py-3.5 text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:focus:bg-neutral-950 text-gray-900 dark:text-white transition-all placeholder:text-gray-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword((s) => !s)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200"
                                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* Primary Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-2xl bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-100 dark:text-black text-white font-bold text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-50 mt-3 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : step === 'otp' ? (
                            'Verify & Complete'
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative my-6 text-center">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-neutral-800" />
                    </div>
                    <span className="relative bg-white dark:bg-black px-4 text-xs font-semibold text-gray-400">
                        Or
                    </span>
                </div>

                {/* Social Sign-in Buttons */}
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => { setMethod('email'); }}
                        className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-3 transition-colors shadow-sm"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>Sign in with Google</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => { setMethod('email'); }}
                        className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-3 transition-colors shadow-sm"
                    >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.98.6-2.62 1.34-.56.64-1.05 1.69-.92 2.71 1 .08 2.02-.49 2.61-1.2" />
                        </svg>
                        <span>Sign in with Apple</span>
                    </button>
                </div>

                {/* Bottom Switcher */}
                <div className="mt-8 text-center text-xs text-gray-500 dark:text-neutral-400">
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        className="font-bold text-gray-900 dark:text-white hover:underline ml-1"
                    >
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    );
}
