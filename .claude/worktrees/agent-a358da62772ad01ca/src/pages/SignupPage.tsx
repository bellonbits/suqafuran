import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Mail, Lock, Phone, ArrowRight, Loader2, Tag, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import { z } from 'zod';
import { Button } from '../components/Button';
import { AuthInput } from '../components/AuthInput';
import { AuthLayout } from '../components/AuthLayout';
import { authService } from '../services/authService';
import { marketingService } from '../services/marketingService';
import { useAuthStore } from '../store/useAuthStore';

const SignupPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const login = useAuthStore((state) => state.login);

    const [tab, setTab] = useState<'email' | 'phone'>('email');

    // ── Promo code (shared) ─────────────────────────────────────────────────
    const [promoCode, setPromoCode] = useState('');
    const [promoStatus, setPromoStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
    const [promoMessage, setPromoMessage] = useState('');

    useEffect(() => {
        const urlPromo = searchParams.get('promo');
        if (urlPromo) setPromoCode(urlPromo.toUpperCase());
    }, [searchParams]);

    useEffect(() => {
        if (!promoCode || promoCode.length < 3) { setPromoStatus('idle'); setPromoMessage(''); return; }
        setPromoStatus('checking');
        const timer = setTimeout(async () => {
            try {
                const res = await marketingService.validateCode(promoCode);
                if (res.valid) { setPromoStatus('valid'); setPromoMessage(res.description || t('auth.promoValid')); }
                else { setPromoStatus('invalid'); setPromoMessage(res.reason || t('auth.promoInvalid')); }
            } catch { setPromoStatus('idle'); }
        }, 600);
        return () => clearTimeout(timer);
    }, [promoCode]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Email signup state ──────────────────────────────────────────────────
    const emailSchema = z.object({
        full_name: z.string().min(2, t('auth.nameTooShort')).max(100).regex(/^[a-zA-Z\s'-]+$/, t('auth.nameInvalid')),
        email: z.string().email(t('auth.invalidEmail')).max(254),
        phone: z.string().regex(/^\+?[0-9\s\-()]{7,20}$/, t('auth.phoneInvalid')).optional().or(z.literal('')),
        password: z.string().min(8, t('auth.passwordTooShort')).max(128)
            .regex(/[A-Z]/, t('auth.passwordUppercase'))
            .regex(/[0-9]/, t('auth.passwordNumber')),
        confirm_password: z.string(),
    }).refine(d => d.password === d.confirm_password, { message: t('auth.passwordsMismatch'), path: ['confirm_password'] });

    const [emailForm, setEmailForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm_password: '' });

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const result = emailSchema.safeParse(emailForm);
        if (!result.success) { setError(result.error.issues[0].message); return; }
        setIsLoading(true);
        try {
            await authService.signup({
                full_name: emailForm.full_name,
                email: emailForm.email,
                phone: emailForm.phone || undefined,
                password: emailForm.password,
                promo_code: promoStatus === 'valid' ? promoCode : undefined,
            } as any);
            navigate(`/email-verification?email=${encodeURIComponent(emailForm.email)}`);
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : Array.isArray(detail) ? detail[0]?.msg : t('auth.signupFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    // ── Phone signup state ──────────────────────────────────────────────────
    const [phoneForm, setPhoneForm] = useState({ full_name: '', phone: '' });
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isVerifying = useRef(false);

    useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

    const startCooldown = (seconds: number) => {
        setCooldown(seconds);
        if (cooldownRef.current) clearInterval(cooldownRef.current);
        cooldownRef.current = setInterval(() => {
            setCooldown(prev => { if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; } return prev - 1; });
        }, 1000);
    };

    const handlePhoneSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!phoneForm.full_name.trim()) { setError('Enter your full name.'); return; }
        if (!phoneForm.phone.trim()) { setError('Enter your phone number.'); return; }
        setIsLoading(true);
        try {
            const res = await authService.signupPhone({
                full_name: phoneForm.full_name.trim(),
                phone: phoneForm.phone.trim(),
                promo_code: promoStatus === 'valid' ? promoCode : undefined,
            });
            setOtpSent(true);
            startCooldown(res.cooldown_seconds || 60);
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : 'Failed to send SMS. Try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const doVerifyPhone = useCallback(async (code: string) => {
        if (isVerifying.current) return;
        isVerifying.current = true;
        setError(null);
        setIsLoading(true);
        try {
            const response = await authService.verifyPhoneOTP(phoneForm.phone.trim(), code);
            useAuthStore.setState({ token: response.access_token });
            const user = await authService.getMe();
            login(user, response.access_token);
            navigate('/');
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : 'Invalid or expired code.');
            isVerifying.current = false;
        } finally {
            setIsLoading(false);
        }
    }, [phoneForm.phone, login, navigate]);

    const handlePhoneVerify = (e: React.FormEvent) => { e.preventDefault(); doVerifyPhone(otp); };

    // Auto-submit when all 6 digits entered
    useEffect(() => { if (otp.length === 6) doVerifyPhone(otp); }, [otp]);

    const promoField = (
        <div className="relative">
            <div className={`flex items-center border rounded-xl px-3 gap-2 transition-colors ${
                promoStatus === 'valid' ? 'border-green-400 bg-green-50' :
                promoStatus === 'invalid' ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
            }`}>
                <Tag className={`h-4 w-4 shrink-0 ${promoStatus === 'valid' ? 'text-green-500' : promoStatus === 'invalid' ? 'text-red-400' : 'text-gray-400'}`} />
                <input type="text" placeholder={t('auth.promoOptional')} value={promoCode}
                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                    className="flex-1 py-3 text-sm bg-transparent outline-none font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal text-gray-900"
                    maxLength={50}
                />
                {promoStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-gray-400 shrink-0" />}
                {promoStatus === 'valid' && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                {promoStatus === 'invalid' && <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
            </div>
            {promoMessage && (
                <p className={`text-xs mt-1 pl-1 font-medium ${promoStatus === 'valid' ? 'text-green-600' : 'text-red-500'}`}>{promoMessage}</p>
            )}
        </div>
    );

    return (
        <AuthLayout title={t('auth.signupTitle')} subtitle={t('auth.signupSubtitle')} imageCaption={t('auth.imageCaption')}>

            {/* Tab switcher */}
            <div className="flex rounded-xl border border-gray-200 p-1 mb-6 bg-gray-50">
                <button type="button" onClick={() => { setTab('email'); setError(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        tab === 'email' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    <Mail className="w-4 h-4" /> Email
                </button>
                <button type="button" onClick={() => { setTab('phone'); setError(null); setOtpSent(false); setOtp(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        tab === 'phone' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    <MessageSquare className="w-4 h-4" /> Phone
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 font-medium mb-4 animate-in fade-in slide-in-from-top-1">{error}</div>
            )}

            {/* ── EMAIL TAB ── */}
            {tab === 'email' && (
                <form className="space-y-4" onSubmit={handleEmailSignup}>
                    <AuthInput id="fullName" type="text" label={t('auth.fullName')} placeholder={t('auth.fullNamePlaceholder')}
                        icon={<User className="w-5 h-5" />} value={emailForm.full_name}
                        onChange={(e) => setEmailForm({ ...emailForm, full_name: e.target.value })} required />

                    <AuthInput id="email" type="email" label={t('auth.emailAddress')} placeholder="you@example.com"
                        icon={<Mail className="w-5 h-5" />} value={emailForm.email}
                        onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })} required />

                    <AuthInput id="phone" type="tel" label={t('auth.phoneOptional')} placeholder="+252612345678"
                        icon={<Phone className="w-5 h-5" />} value={emailForm.phone}
                        onChange={(e) => setEmailForm({ ...emailForm, phone: e.target.value })} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AuthInput id="password" type="password" label={t('auth.password')} placeholder="••••••••"
                            icon={<Lock className="w-5 h-5" />} value={emailForm.password}
                            onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })} required />
                        <AuthInput id="confirmPassword" type="password" label={t('auth.confirmPassword')} placeholder="••••••••"
                            icon={<Lock className="w-5 h-5" />} value={emailForm.confirm_password}
                            onChange={(e) => setEmailForm({ ...emailForm, confirm_password: e.target.value })} required />
                    </div>

                    {promoField}

                    <Button type="submit"
                        className="w-full h-12 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-black transition-all shadow-lg shadow-primary-500/20 border border-primary-600/10 mt-2 active:scale-95"
                        disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                            <div className="flex items-center justify-center gap-2">
                                <span>{t('auth.continue')}</span><ArrowRight className="w-5 h-5" />
                            </div>
                        )}
                    </Button>

                    <div className="text-center">
                        <p className="text-sm text-gray-600">{t('auth.haveAccount')}{' '}
                            <button type="button" onClick={() => navigate('/login')}
                                className="font-bold text-primary-400 hover:text-primary-500 hover:underline">{t('auth.logIn')}</button>
                        </p>
                    </div>
                </form>
            )}

            {/* ── PHONE TAB ── */}
            {tab === 'phone' && (
                <div className="space-y-6">
                    {!otpSent ? (
                        <form onSubmit={handlePhoneSend} className="space-y-4">
                            <AuthInput id="phoneName" type="text" label={t('auth.fullName')} placeholder={t('auth.fullNamePlaceholder')}
                                icon={<User className="w-5 h-5" />} value={phoneForm.full_name}
                                onChange={(e) => setPhoneForm({ ...phoneForm, full_name: e.target.value })} required />

                            <div>
                                <AuthInput id="phoneNumber" type="tel" label="Phone number" placeholder="+252612345678"
                                    icon={<Phone className="w-5 h-5" />} value={phoneForm.phone}
                                    onChange={(e) => setPhoneForm({ ...phoneForm, phone: e.target.value })} required />
                                <p className="text-xs text-gray-400 mt-1 pl-1">
                                    Somali: +252 6xx xxx xxx &nbsp;·&nbsp; Kenyan: +254 7xx xxx xxx
                                </p>
                            </div>

                            {promoField}

                            <Button type="submit"
                                className="w-full h-12 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-black transition-all shadow-lg shadow-primary-500/20 border border-primary-600/10 active:scale-95"
                                disabled={isLoading}>
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                                    <div className="flex items-center justify-center gap-2">
                                        <span>Send verification code</span><ArrowRight className="w-5 h-5" />
                                    </div>
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handlePhoneVerify} className="space-y-6">
                            <div className="text-center bg-sky-50 border border-sky-100 rounded-xl p-4">
                                <p className="text-sm font-semibold text-sky-800">Code sent to</p>
                                <p className="text-base font-black text-sky-900 mt-0.5">{phoneForm.phone}</p>
                                <p className="text-xs text-sky-600 mt-1">Check your SMS messages</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Enter 6-digit code</label>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    placeholder="• • • • • •"
                                    className="w-full text-center text-3xl font-black tracking-[0.5em] border border-gray-200 rounded-xl py-4 outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                                    autoFocus
                                />
                            </div>

                            <Button type="submit"
                                className="w-full h-12 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-black transition-all shadow-lg shadow-primary-500/20 active:scale-95"
                                disabled={isLoading || otp.length !== 6}>
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                                    <div className="flex items-center justify-center gap-2">
                                        <span>Create account</span><ArrowRight className="w-5 h-5" />
                                    </div>
                                )}
                            </Button>

                            <div className="text-center space-y-2">
                                <button type="button" onClick={() => { setOtpSent(false); setOtp(''); setError(null); }}
                                    className="text-sm text-gray-500 hover:text-gray-700 underline">
                                    Change number
                                </button>
                                {cooldown > 0 ? (
                                    <p className="text-xs text-gray-400 block">Resend in {cooldown}s</p>
                                ) : (
                                    <button type="button"
                                        onClick={async () => {
                                            setError(null); setIsLoading(true);
                                            try {
                                                const res = await authService.signupPhone({ full_name: phoneForm.full_name, phone: phoneForm.phone.trim() });
                                                startCooldown(res.cooldown_seconds || 60);
                                            } catch (err: any) {
                                                setError(err.response?.data?.detail || 'Failed to resend.');
                                            } finally { setIsLoading(false); }
                                        }}
                                        className="block text-sm font-semibold text-primary-500 hover:text-primary-600 mx-auto">
                                        Resend code
                                    </button>
                                )}
                            </div>
                        </form>
                    )}

                    <div className="text-center">
                        <p className="text-sm text-gray-600">{t('auth.haveAccount')}{' '}
                            <button type="button" onClick={() => navigate('/login')}
                                className="font-bold text-primary-400 hover:text-primary-500 hover:underline">{t('auth.logIn')}</button>
                        </p>
                    </div>
                </div>
            )}
        </AuthLayout>
    );
};

export { SignupPage };
