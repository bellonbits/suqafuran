"use client";

import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User as UserIcon, Phone, Loader2, RotateCw, Eye, EyeOff } from 'lucide-react';
import { useAuthModal } from '../../store/useAuthModal';
import { useAuthStore } from '../../store/useAuth';
import { authService } from '../../services/auth';
import { identifyUser, trackEvent } from '../../lib/analytics';

type Method = 'email' | 'phone';
type Step = 'form' | 'otp';

const COUNTRY_CODES = [
    { code: '+252', label: 'Somalia +252', flag: '🇸🇴' },
    { code: '+254', label: 'Kenya +254', flag: '🇰🇪' },
    { code: '+251', label: 'Ethiopia +251', flag: '🇪🇹' },
    { code: '+253', label: 'Djibouti +253', flag: '🇩🇯' },
];

export const AuthModal: React.FC = () => {
    const { isOpen, mode, open, close } = useAuthModal();
    const { login: storeLogin } = useAuthStore();

    const [method, setMethod] = useState<Method>('email');
    const [step, setStep] = useState<Step>('form');

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [countryCode, setCountryCode] = useState('+254');
    const [localPhone, setLocalPhone] = useState('');
    const [otp, setOtp] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cooldown, setCooldown] = useState(0);

    const phone = `${countryCode}${localPhone.replace(/\D/g, '')}`;

    // Reset transient state whenever the modal opens or the user switches mode/method
    useEffect(() => {
        if (isOpen) {
            setStep('form');
            setOtp('');
            setError('');
            setPassword('');
        }
    }, [isOpen, mode, method]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    if (!isOpen) return null;

    const finishLogin = async (token: string) => {
        const user = await authService.getMe(token);
        storeLogin(user, token);
        identifyUser(user);
        trackEvent(mode === 'signup' ? 'Signup Completed' : 'Login', { method });
        close();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        setLoading(true);
        try {
            if (mode === 'signin' && method === 'email') {
                const { access_token } = await authService.loginWithPassword(email, password);
                await finishLogin(access_token);
            } else if (mode === 'signin' && method === 'phone') {
                if (step === 'form') {
                    const ack = await authService.requestPhoneOtp(phone);
                    setCooldown(ack.cooldown_seconds || 60);
                    setStep('otp');
                } else {
                    const { access_token } = await authService.verifyPhoneOtp(phone, otp);
                    await finishLogin(access_token);
                }
            } else if (mode === 'signup' && method === 'email') {
                if (step === 'form') {
                    const ack = await authService.signupEmail({ full_name: fullName, email, password });
                    setCooldown(ack.cooldown_seconds || 60);
                    setStep('otp');
                } else {
                    const { access_token } = await authService.verifyEmailOtp(email, otp);
                    await finishLogin(access_token);
                }
            } else if (mode === 'signup' && method === 'phone') {
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
            setError(err?.response?.data?.detail || 'Something went wrong. Please try again.');
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={close}>
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-3xl bg-white dark:bg-neutral-950 border border-gray-100 dark:border-neutral-800 shadow-2xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto animate-scale-in"
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-neutral-50 font-poppins">
                            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                            {mode === 'signin'
                                ? 'Sign in to continue to Suqafuran market'
                                : 'Create your account for daily updates'}
                        </p>
                    </div>
                    <button
                        onClick={close}
                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-900 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-neutral-100 transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Mode Switcher */}
                <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800">
                    {(['signin', 'signup'] as const).map(m => (
                        <button
                            key={m}
                            onClick={() => open(m)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                                mode === m
                                    ? 'bg-white dark:bg-neutral-800 text-gray-950 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800'
                            }`}
                        >
                            {m === 'signin' ? 'Sign In' : 'Sign Up'}
                        </button>
                    ))}
                </div>

                {/* Method Switcher */}
                {step === 'form' && (
                    <div className="flex gap-2">
                        {(['email', 'phone'] as const).map(m => (
                            <button
                                key={m}
                                onClick={() => setMethod(m)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                                    method === m
                                        ? 'border-orange-500 bg-orange-50/50 text-orange-600 dark:text-orange-400 dark:border-orange-500 dark:bg-orange-950/20'
                                        : 'border-slate-200 text-gray-500 dark:border-neutral-800 dark:text-neutral-400 hover:border-slate-300'
                                }`}
                            >
                                {m === 'email' ? <Mail className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
                                {m === 'email' ? 'Email' : 'Phone'}
                            </button>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-2xl border border-red-100 dark:bg-red-950/20 dark:border-red-900/30">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                    {step === 'otp' ? (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-gray-600 dark:text-neutral-300 block mb-1">
                                    Verification Code
                                </label>
                                <p className="text-[10px] text-gray-500 dark:text-neutral-400 mb-2">
                                    We sent a code to <span className="font-bold text-gray-800 dark:text-neutral-200">{method === 'email' ? email : phone}</span>
                                </p>
                            </div>
                            <input
                                type="text"
                                required
                                autoFocus
                                inputMode="numeric"
                                placeholder="6-digit code"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                                className="w-full rounded-2xl border border-gray-200 dark:border-neutral-800 bg-slate-50 dark:bg-black px-4 py-3.5 text-lg font-bold tracking-[0.25em] text-center outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:text-neutral-50"
                            />
                            <div className="flex items-center justify-between pt-1">
                                <span className="text-[10px] text-gray-500 dark:text-neutral-400">
                                    Didn't receive the code?
                                </span>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={cooldown > 0}
                                    className="flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline disabled:text-gray-400 disabled:dark:text-neutral-300 disabled:cursor-not-allowed"
                                >
                                    {cooldown > 0 ? (
                                        `Resend in ${cooldown}s`
                                    ) : (
                                        <>
                                            <RotateCw className="h-3 w-3" />
                                            Resend code
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {mode === 'signup' && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600 dark:text-neutral-300">Full Name</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="Enter your full name..."
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full rounded-2xl border border-gray-200 dark:border-neutral-800 bg-slate-50 dark:bg-black pl-11 pr-4 py-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:text-neutral-50"
                                        />
                                    </div>
                                </div>
                            )}

                            {method === 'email' ? (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600 dark:text-neutral-300">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="email"
                                            required
                                            placeholder="Enter your email..."
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full rounded-2xl border border-gray-200 dark:border-neutral-800 bg-slate-50 dark:bg-black pl-11 pr-4 py-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:text-neutral-50"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600 dark:text-neutral-300">Mobile Number</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={countryCode}
                                            onChange={(e) => setCountryCode(e.target.value)}
                                            className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-slate-50 dark:bg-black px-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 dark:text-neutral-50"
                                        >
                                            {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                                        </select>
                                        <div className="relative flex-1">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="tel"
                                                required
                                                placeholder="712345678"
                                                value={localPhone}
                                                onChange={(e) => setLocalPhone(e.target.value)}
                                                className="w-full rounded-2xl border border-gray-200 dark:border-neutral-800 bg-slate-50 dark:bg-black pl-11 pr-4 py-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:text-neutral-50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {mode === 'signin' && method === 'email' && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-gray-600 dark:text-neutral-300">Password</label>
                                        <button
                                            type="button"
                                            onClick={() => { close(); window.location.href = '/reset-password'; }}
                                            className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            placeholder="Enter your password..."
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full rounded-2xl border border-gray-200 dark:border-neutral-800 bg-slate-50 dark:bg-black pl-11 pr-11 py-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:text-neutral-50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(s => !s)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {mode === 'signup' && method === 'email' && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600 dark:text-neutral-300">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            minLength={8}
                                            placeholder="At least 8 characters"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full rounded-2xl border border-gray-200 dark:border-neutral-800 bg-slate-50 dark:bg-black pl-11 pr-11 py-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:text-neutral-50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(s => !s)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-2xl bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : step === 'otp' ? (
                            <span>Verify &amp; Continue</span>
                        ) : mode === 'signin' && method === 'phone' ? (
                            <span>Send Code</span>
                        ) : mode === 'signup' ? (
                            <span>Create Account</span>
                        ) : (
                            <span>Log In</span>
                        )}
                    </button>
                </form>

                {/* Divider & Social */}
                <div className="relative my-4 text-center">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-neutral-800" />
                    </div>
                    <span className="relative bg-white dark:bg-neutral-950 px-3 text-[11px] font-semibold text-gray-400">
                        Or
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                    <button
                        type="button"
                        onClick={() => setMethod('email')}
                        className="py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>Google</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setMethod('email')}
                        className="py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.98.6-2.62 1.34-.56.64-1.05 1.69-.92 2.71 1 .08 2.02-.49 2.61-1.2" />
                        </svg>
                        <span>Apple</span>
                    </button>
                </div>

                <div className="text-center text-xs text-gray-500 dark:text-neutral-400 pt-1">
                    {mode === 'signin' ? (
                        <>
                            Don't have an account?{' '}
                            <button
                                type="button"
                                onClick={() => open('signup')}
                                className="font-bold text-gray-900 dark:text-white hover:underline ml-1"
                            >
                                Sign up
                            </button>
                        </>
                    ) : (
                        <>
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={() => open('signin')}
                                className="font-bold text-gray-900 dark:text-white hover:underline ml-1"
                            >
                                Log in
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
