import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, ArrowRight, Loader2, ShieldAlert, Fingerprint, Phone, MessageSquare } from 'lucide-react';
import { z } from 'zod';
import { Button } from '../components/Button';
import { AuthInput } from '../components/AuthInput';
import { AuthLayout } from '../components/AuthLayout';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/authService';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { BiometricScanner } from '../components/BiometricScanner';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 5 * 60;
const STORAGE_KEY = 'login_lockout';

function getLockout(): { attempts: number; lockedUntil: number } {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
        return { attempts: 0, lockedUntil: 0 };
    }
}

function saveLockout(data: { attempts: number; lockedUntil: number }) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const LoginPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    // tab: 'email' | 'phone'
    const [tab, setTab] = useState<'email' | 'phone'>('email');

    // Email+password state
    const loginSchema = z.object({
        email: z.string().email(t('auth.invalidEmail')),
        password: z.string().min(1, t('auth.passwordRequired')).max(128),
    });
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Phone OTP state
    const [phone, setPhone] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [cooldown, setCooldown] = useState(0);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(0);
    const [showScanner, setShowScanner] = useState(false);
    const [hasBiometrics, setHasBiometrics] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const { lockedUntil } = getLockout();
        const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
        if (remaining > 0) startCountdown(remaining);

        if (Capacitor.isNativePlatform()) {
            Preferences.get({ key: 'suqa_biometric_creds' }).then(({ value }) => {
                if (value) setHasBiometrics(true);
            });
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (cooldownRef.current) clearInterval(cooldownRef.current);
        };
    }, []);

    const startCountdown = (seconds: number) => {
        setCountdown(seconds);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    saveLockout({ attempts: 0, lockedUntil: 0 });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const startCooldown = (seconds: number) => {
        setCooldown(seconds);
        if (cooldownRef.current) clearInterval(cooldownRef.current);
        cooldownRef.current = setInterval(() => {
            setCooldown(prev => {
                if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    // ── Email + password login ──────────────────────────────────────────────
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const lockout = getLockout();
        if (lockout.lockedUntil > Date.now()) return;

        const result = loginSchema.safeParse({ email, password });
        if (!result.success) { setError(result.error.issues[0].message); return; }

        setIsLoading(true);
        try {
            const response = await authService.login({ email, password });
            saveLockout({ attempts: 0, lockedUntil: 0 });
            useAuthStore.setState({ token: response.access_token });

            if (Capacitor.isNativePlatform()) {
                await Preferences.set({ key: 'suqa_biometric_creds', value: JSON.stringify({ email, password }) });
                setHasBiometrics(true);
            }
            const user = await authService.getMe();
            login(user, response.access_token);
            navigate('/');
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            const message = typeof detail === 'string' ? detail : t('auth.invalidCredentials');
            const lockout = getLockout();
            const newAttempts = (lockout.attempts || 0) + 1;
            if (newAttempts >= MAX_ATTEMPTS) {
                const lockedUntil = Date.now() + LOCKOUT_SECONDS * 1000;
                saveLockout({ attempts: newAttempts, lockedUntil });
                startCountdown(LOCKOUT_SECONDS);
                setError(t('auth.tooManyAttemptsDesc', { time: formatTime(LOCKOUT_SECONDS) }));
            } else {
                saveLockout({ attempts: newAttempts, lockedUntil: 0 });
                setError(`${message}. ${t('auth.attemptsRemaining', { count: MAX_ATTEMPTS - newAttempts })}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ── Phone OTP: send ─────────────────────────────────────────────────────
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!phone.trim()) { setError('Enter your phone number.'); return; }
        setIsLoading(true);
        try {
            const res = await authService.requestPhoneOTP(phone.trim());
            setOtpSent(true);
            startCooldown(res.cooldown_seconds || 60);
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : 'Failed to send SMS. Try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Phone OTP: verify ───────────────────────────────────────────────────
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (otp.length !== 6) { setError('Enter the 6-digit code.'); return; }
        setIsLoading(true);
        try {
            const response = await authService.verifyPhoneOTP(phone.trim(), otp.trim());
            useAuthStore.setState({ token: response.access_token });
            const user = await authService.getMe();
            login(user, response.access_token);
            navigate('/');
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : 'Invalid or expired code.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBiometricSuccess = async () => {
        setShowScanner(false);
        try {
            const { value } = await Preferences.get({ key: 'suqa_biometric_creds' });
            if (!value) return;
            const creds = JSON.parse(value);
            setIsLoading(true);
            const response = await authService.login({ email: creds.email, password: creds.password });
            saveLockout({ attempts: 0, lockedUntil: 0 });
            useAuthStore.setState({ token: response.access_token });
            const user = await authService.getMe();
            login(user, response.access_token);
            navigate('/');
        } catch {
            setError(t('auth.invalidCredentials', 'Biometric login failed. Please sign in manually.'));
        } finally {
            setIsLoading(false);
        }
    };

    const isLocked = countdown > 0;

    return (
        <AuthLayout
            title={t('auth.loginTitle')}
            subtitle={t('auth.loginSubtitle')}
            imageCaption={t('auth.imageCaption')}
        >
            {/* Tab switcher */}
            <div className="flex rounded-xl border border-gray-200 p-1 mb-6 bg-gray-50">
                <button
                    type="button"
                    onClick={() => { setTab('email'); setError(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        tab === 'email' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Mail className="w-4 h-4" />
                    Email
                </button>
                <button
                    type="button"
                    onClick={() => { setTab('phone'); setError(null); setOtpSent(false); setOtp(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        tab === 'phone' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <MessageSquare className="w-4 h-4" />
                    SMS OTP
                </button>
            </div>

            {/* ── EMAIL TAB ── */}
            {tab === 'email' && (
                <form onSubmit={handleLogin} className="space-y-6">
                    {isLocked ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                            <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-red-700">{t('auth.accountLocked')}</p>
                                <p className="text-sm text-red-600 mt-0.5">{t('auth.tooManyAttemptsDesc', { time: formatTime(countdown) })}</p>
                            </div>
                        </div>
                    ) : error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 font-medium">{error}</div>
                    )}

                    <AuthInput
                        label={t('auth.emailAddress')}
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        icon={<Mail className="h-4 w-4" />}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLocked}
                    />

                    <div className="space-y-1">
                        <AuthInput
                            label={t('auth.password')}
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            icon={<Lock className="h-4 w-4" />}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLocked}
                        />
                        <div className="flex justify-end">
                            <Link to="/forgot-password" className="text-sm font-medium text-primary-400 hover:text-primary-500 hover:underline">
                                {t('auth.forgotPasswordLink')}
                            </Link>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 text-sm font-black rounded-xl bg-primary-500 hover:bg-primary-600 border border-primary-600/10 shadow-lg shadow-primary-500/20 text-white disabled:opacity-50 transition-all active:scale-95"
                        disabled={isLoading || isLocked}
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> :
                         isLocked ? <span>{t('auth.lockedBtn', { time: formatTime(countdown) })}</span> : (
                            <div className="flex items-center justify-center gap-2">
                                <span>{t('auth.signIn')}</span>
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        )}
                    </Button>

                    {hasBiometrics && (
                        <Button type="button" variant="outline"
                            onClick={() => setShowScanner(true)}
                            className="w-full h-12 text-sm font-bold rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                            disabled={isLoading || isLocked}
                        >
                            <Fingerprint className="w-5 h-5 text-primary-500" />
                            Sign in with Biometrics
                        </Button>
                    )}

                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            {t('auth.noAccount')}{' '}
                            <button type="button" onClick={() => navigate('/signup')}
                                className="font-bold text-primary-400 hover:text-primary-500 hover:underline">
                                {t('auth.createAccount')}
                            </button>
                        </p>
                    </div>
                </form>
            )}

            {/* ── PHONE OTP TAB ── */}
            {tab === 'phone' && (
                <div className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 font-medium">{error}</div>
                    )}

                    {!otpSent ? (
                        <form onSubmit={handleSendOtp} className="space-y-6">
                            <AuthInput
                                label="Phone number"
                                id="phone"
                                type="tel"
                                placeholder="+252612345678"
                                icon={<Phone className="h-4 w-4" />}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                            <p className="text-xs text-gray-500 -mt-4">
                                Somali: +252 6xx xxx xxx &nbsp;|&nbsp; Kenyan: +254 7xx xxx xxx
                            </p>
                            <Button type="submit"
                                className="w-full h-12 text-sm font-black rounded-xl bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 transition-all active:scale-95"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                                    <div className="flex items-center justify-center gap-2">
                                        <span>Send OTP</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="text-center bg-sky-50 border border-sky-100 rounded-xl p-4">
                                <p className="text-sm font-semibold text-sky-800">Code sent to</p>
                                <p className="text-base font-black text-sky-900 mt-0.5">{phone}</p>
                                <p className="text-xs text-sky-600 mt-1">Check your SMS messages</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">6-digit code</label>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/\D/g, '');
                                        setOtp(v);
                                    }}
                                    placeholder="• • • • • •"
                                    className="w-full text-center text-3xl font-black tracking-[0.5em] border border-gray-200 rounded-xl py-4 outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                                />
                            </div>

                            <Button type="submit"
                                className="w-full h-12 text-sm font-black rounded-xl bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 transition-all active:scale-95"
                                disabled={isLoading || otp.length !== 6}
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                                    <div className="flex items-center justify-center gap-2">
                                        <span>Verify & Sign In</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                )}
                            </Button>

                            <div className="text-center">
                                <button type="button"
                                    onClick={(e) => { setOtpSent(false); setOtp(''); setError(null); }}
                                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                                >
                                    Change number
                                </button>
                                {cooldown > 0 ? (
                                    <p className="text-xs text-gray-400 mt-2">Resend in {cooldown}s</p>
                                ) : (
                                    <button type="button"
                                        onClick={async () => {
                                            setError(null);
                                            setIsLoading(true);
                                            try {
                                                const res = await authService.requestPhoneOTP(phone.trim());
                                                startCooldown(res.cooldown_seconds || 60);
                                            } catch (err: any) {
                                                setError(err.response?.data?.detail || 'Failed to resend.');
                                            } finally { setIsLoading(false); }
                                        }}
                                        className="block text-sm font-semibold text-primary-500 hover:text-primary-600 mt-2 mx-auto"
                                        disabled={isLoading}
                                    >
                                        Resend code
                                    </button>
                                )}
                            </div>
                        </form>
                    )}

                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            {t('auth.noAccount')}{' '}
                            <button type="button" onClick={() => navigate('/signup')}
                                className="font-bold text-primary-400 hover:text-primary-500 hover:underline">
                                {t('auth.createAccount')}
                            </button>
                        </p>
                    </div>
                </div>
            )}

            {showScanner && (
                <BiometricScanner
                    onComplete={handleBiometricSuccess}
                    onCancel={() => setShowScanner(false)}
                    fetchResult={async () => new Promise((resolve) => setTimeout(() => resolve({ is_authentic: true, match_score: 99.9 }), 1500))}
                />
            )}
        </AuthLayout>
    );
};

export { LoginPage };
