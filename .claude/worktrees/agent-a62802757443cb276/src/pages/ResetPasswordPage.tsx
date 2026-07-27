import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, CheckCircle, ArrowRight, ArrowLeft, ShieldCheck, RefreshCw, Mail } from 'lucide-react';
import { Button } from '../components/Button';
import { AuthInput } from '../components/AuthInput';
import { AuthLayout } from '../components/AuthLayout';
import { authService } from '../services/authService';

const CODE_LENGTH = 6;

const ResetPasswordPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const emailFromUrl = searchParams.get('email') || '';

    // step: 'code' | 'password' | 'success'
    const [step, setStep] = useState<'code' | 'password' | 'success'>('code');

    const [email] = useState(emailFromUrl);
    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer for resend
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    // Focus first box on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const code = digits.join('');

    const handleDigitChange = (idx: number, value: string) => {
        // Handle paste of full code
        if (value.length > 1) {
            const pasted = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
            const next = Array(CODE_LENGTH).fill('');
            pasted.split('').forEach((ch, i) => { next[i] = ch; });
            setDigits(next);
            const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
            inputRefs.current[focusIdx]?.focus();
            return;
        }
        const digit = value.replace(/\D/g, '');
        const next = [...digits];
        next[idx] = digit;
        setDigits(next);
        if (digit && idx < CODE_LENGTH - 1) {
            inputRefs.current[idx + 1]?.focus();
        }
    };

    const handleDigitKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
            inputRefs.current[idx - 1]?.focus();
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length < CODE_LENGTH) {
            setError(t('auth.enterFullCode', 'Please enter the full 6-digit code'));
            return;
        }
        setStep('password');
        setError(null);
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError(t('auth.passwordMismatch'));
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await authService.resetPassword({ email, code, new_password: password });
            setStep('success');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            const message = typeof detail === 'string'
                ? detail
                : Array.isArray(detail)
                    ? detail[0]?.msg || t('common.error')
                    : t('common.error');
            setError(message);
            // If code is wrong, go back to code step
            if (message.toLowerCase().includes('code') || message.toLowerCase().includes('invalid')) {
                setStep('code');
                setDigits(Array(CODE_LENGTH).fill(''));
                setTimeout(() => inputRefs.current[0]?.focus(), 100);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email || resendCooldown > 0) return;
        setResendLoading(true);
        setError(null);
        try {
            await authService.forgotPassword(email);
            setResendCooldown(60);
            setDigits(Array(CODE_LENGTH).fill(''));
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : t('common.error'));
        } finally {
            setResendLoading(false);
        }
    };

    // ── Success ──────────────────────────────────────────────────────────────
    if (step === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.passwordResetSuccess')}</h2>
                    <p className="text-gray-500">{t('auth.passwordResetSuccessDesc')}</p>
                    <p className="text-xs text-gray-400 mt-4">{t('auth.redirectingToLogin', 'Redirecting to login…')}</p>
                </div>
            </div>
        );
    }

    // ── Step 1 — Enter code ──────────────────────────────────────────────────
    if (step === 'code') {
        return (
            <AuthLayout
                title={t('auth.enterResetCode', 'Enter reset code')}
                subtitle={t('auth.enterResetCodeSubtitle', 'We sent a 6-digit code to your email')}
                imageCaption={t('auth.forgotPasswordCaption')}
            >
                <form className="space-y-6" onSubmit={handleVerifyCode}>
                    {/* Email hint */}
                    {email && (
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                            <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-600 font-medium truncate">{email}</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 font-medium">
                            {error}
                        </div>
                    )}

                    {/* Icon */}
                    <div className="flex justify-center">
                        <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center">
                            <ShieldCheck className="w-7 h-7 text-primary-600" />
                        </div>
                    </div>

                    {/* 6-digit boxes */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                            {t('auth.resetCode', 'Reset Code')}
                        </label>
                        <div className="flex justify-center gap-2.5">
                            {digits.map((digit, idx) => (
                                <input
                                    key={idx}
                                    ref={(el) => { inputRefs.current[idx] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={digit}
                                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                                    onFocus={(e) => e.target.select()}
                                    className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all
                                        ${digit
                                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                                            : 'border-gray-200 bg-white text-gray-900 focus:border-primary-400 focus:bg-primary-50/50'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-primary-300 hover:bg-primary-400 text-white font-bold shadow-lg shadow-primary-300/30"
                        disabled={code.length < CODE_LENGTH}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span>{t('auth.verifyCode', 'Verify Code')}</span>
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </Button>

                    {/* Resend */}
                    <div className="text-center">
                        <p className="text-sm text-gray-500">
                            {t('auth.didntReceiveCode', "Didn't receive code?")}{' '}
                            {resendCooldown > 0 ? (
                                <span className="text-gray-400 font-medium">
                                    {t('auth.resendIn', 'Resend in')} {resendCooldown}s
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={resendLoading}
                                    className="font-bold text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center gap-1"
                                >
                                    {resendLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
                                    {t('auth.resend', 'Resend')}
                                </button>
                            )}
                        </p>
                    </div>

                    <div className="text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <ArrowLeft className="mr-2 w-4 h-4" />
                            {t('auth.rememberPassword')}
                        </Link>
                    </div>
                </form>
            </AuthLayout>
        );
    }

    // ── Step 2 — New password ────────────────────────────────────────────────
    return (
        <AuthLayout
            title={t('auth.resetPasswordTitle')}
            subtitle={t('auth.resetPasswordSubtitle')}
            imageCaption={t('auth.forgotPasswordCaption')}
        >
            <form className="space-y-4" onSubmit={handleReset}>
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 font-medium">
                        {error}
                    </div>
                )}

                {/* Code confirmed badge */}
                <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="text-sm text-green-700 font-medium">
                        {t('auth.codeVerified', 'Code verified')} — {t('auth.nowSetPassword', 'now set your new password')}
                    </span>
                </div>

                <AuthInput
                    label={t('auth.newPassword')}
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    icon={<Lock className="h-4 w-4" />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <AuthInput
                    label={t('auth.confirmNewPassword')}
                    id="confirmPassword"
                    type="password"
                    required
                    placeholder="••••••••"
                    icon={<Lock className="h-4 w-4" />}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={confirmPassword && password !== confirmPassword ? t('auth.passwordMismatch') : undefined}
                />

                <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-primary-300 hover:bg-primary-400 text-white font-bold shadow-lg shadow-primary-300/30 mt-2"
                    isLoading={loading}
                >
                    <div className="flex items-center justify-center gap-2">
                        <span>{t('auth.resetPasswordBtn')}</span>
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </Button>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => { setStep('code'); setError(null); }}
                        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        {t('auth.backToCode', 'Back to code')}
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
};

export { ResetPasswordPage };
